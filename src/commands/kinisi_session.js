// File: kinisi_session.js
// Shared API-v2 framing, readiness and clock exchange for serial and proxy transports.
import { Commands, INIT, READY, ERROR, TIME_SYNC_REQUEST, TIME_SYNC_RESPONSE,
  SDK_VERSION, InitResponse, ErrorCode, ErrorDescriptions, GET_TEMPERATURE, GET_IMU, GET_MOTOR_CURRENT, GET_MOTOR_FAULTS, CLEAR_MOTOR_FAULTS, GET_PWM_FREQUENCY, SET_PWM_FREQUENCY, GET_MOTOR_CURRENT_LIMIT, SET_MOTOR_CURRENT_LIMIT,
  SET_HEARTBEAT_CONFIG, UNSUBSCRIBE_ODOMETRY, ENCODER_ODOMETRY_EVENT, PLATFORM_ODOMETRY_EVENT,
  SUBSCRIBE_ODOMETRY, SUBSCRIBE, SUBSCRIBE_WITH_MODE, SUBSCRIBE_CONFIGURED, UNSUBSCRIBE, TELEMETRY_EVENT, Topic, SubscriptionMode, SubscriptionTrigger, SubscriptionDelivery,
  decodeTelemetryEvent, EncoderOdometrySample, PlatformOdometrySample } from './kinisi_commands.js';
import { POSITION_COMMANDS, supportsPositionControl, POSITION_PID_COMMANDS, supportsPositionPidControl } from './position_control.js';
import { supportsTemperatureRead } from './temperature.js';
import { supportsImuRead } from './imu.js';
import { getBoardProfile, supportsBoardSensor, supportsMotorCurrent, supportsMotorFaults, getMotorCurrentLimitOptions, supportsMotorCurrentLimit, getPwmFrequencyOptions, supportsPwmFrequency } from './board_profile.js';
import { supportsTelemetry, supportsTopic } from './telemetry.js';

export { PwmFrequency, Topic, SubscriptionMode, SubscriptionTrigger, SubscriptionDelivery } from './kinisi_commands.js';

// Existing controls need 2.1; additive commands are gated separately.
const MIN_PROTOCOL_VERSION = [2, 1, 0];

/** A controller ERROR retains the original request identity and error code. */
export class ControllerError extends Error {
  constructor(code, command, messageId) {
    const label = Object.keys(ErrorCode).find((key) => ErrorCode[key] === code) || `ERROR_${code}`;
    super(`${label}: ${ErrorDescriptions[code] || 'Controller rejected the request'}`);
    this.name = 'ControllerError'; this.code = code; this.command = command; this.messageId = messageId;
  }
}
/** Transport/framing failures are distinct from valid controller error replies. */
export class ProtocolError extends Error { constructor(message) { super(message); this.name = 'ProtocolError'; } }
export class RequestTimeoutError extends Error { constructor(message) { super(message); this.name = 'RequestTimeoutError'; } }
export class ConnectionClosedError extends Error { constructor(message = 'Connection closed') { super(message); this.name = 'ConnectionClosedError'; } }

/** Create a stable Unix-microsecond clock anchored to the host's current wall time. */
function unixClock() {
  const epoch = BigInt(Date.now()) * 1000n;
  const origin = performance.now();
  return () => epoch + BigInt(Math.round((performance.now() - origin) * 1000));
}
/** Convert ArrayBuffers and byte views without accidentally including surrounding bytes. */
function bytes(data) {
  return ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
}
/** Build one packed API-v2 frame. Length excludes its own byte. */
function frame(command, id, payload = new Uint8Array()) {
  const data = bytes(payload);
  if (data.length > 251) throw new ProtocolError('Payload exceeds the protocol frame limit');
  const result = new Uint8Array(data.length + 4);
  result.set([data.length + 3, command, id & 255, id >> 8]);
  result.set(data, 4);
  return result;
}

export class KinisiSession extends Commands {
  /** Configure deadlines and optionally choose uptime mode or a Unix-us clock provider. */
  constructor({ wallClock = true, requestTimeoutMs = 2000, initTimeoutMs = 5000,
    frameTimeoutMs = 2000, nowUnixUs = unixClock(), heartbeatTimeoutMs = 500 } = {}) {
    super();
    for (const value of [requestTimeoutMs, initTimeoutMs, frameTimeoutMs]) {
      if (!Number.isFinite(value) || value <= 0) throw new TypeError('Timeouts must be positive milliseconds');
    }
    this.wallClock = wallClock; this.requestTimeoutMs = requestTimeoutMs;
    this.initTimeoutMs = initTimeoutMs; this.frameTimeoutMs = frameTimeoutMs;
    this.nowUnixUs = nowUnixUs;
    if (heartbeatTimeoutMs !== null && (!Number.isInteger(heartbeatTimeoutMs) || heartbeatTimeoutMs < 100 || heartbeatTimeoutMs > 60000)) {
      throw new TypeError('heartbeatTimeoutMs must be 100..60000, or null to disable');
    }
    this.heartbeatTimeoutMs = heartbeatTimeoutMs;
    this._heartbeatTimer = null; this._heartbeatIntervalMs = null; this._lastSentMs = 0;
    this._heartbeatPending = false;
    this._subscriptionSamples = new Map();
    this._telemetryListeners = new Map();
    this._telemetryCandidates = new Map();
    this._telemetryOperations = new Map();
    this.lastTelemetryError = null;
    this.ready = false; this.boardInfo = null; this.clockMode = null;
    this.lastError = null; this.lastSyncError = null;
    this._pending = new Map(); this._retired = new Set(); this._nextId = 1;
    this._writeChain = Promise.resolve(); this._buffer = new Uint8Array();
    this._frameTimer = null; this._session = null;
  }

  /** Start receiving continuously, then await both identity and the final READY. */
  async _startSession() {
    if (this._session) throw new ProtocolError('Session already active');
    this.ready = false; this.boardInfo = null; this.clockMode = null;
    this.lastError = null; this.lastSyncError = null; this._buffer = new Uint8Array();
    this.lastTelemetryError = null;
    this._retired.clear(); this._writeChain = Promise.resolve();
    const session = {}; this._session = session;
    const init = this._sendRequest(INIT, new Uint8Array([2, ...SDK_VERSION, ...MIN_PROTOCOL_VERSION, this.wallClock ? 3 : 2]), InitResponse.getSize(), true);
    this._readerTask = this._readLoop(session);
    await init;
    if (this.heartbeatTimeoutMs !== null) await this.set_heartbeat_config(true, this.heartbeatTimeoutMs);
  }

  /** Allocate nonzero IDs, avoiding live requests and IDs retired after timeout. */
  _allocateId() {
    for (let i = 0; i < 65535; i++) {
      const id = this._nextId; this._nextId = id === 65535 ? 1 : id + 1;
      if (!this._pending.has(id) && !this._retired.has(id)) return id;
    }
    throw new ProtocolError('Message IDs exhausted; reconnect before sending more commands');
  }

  /** Queue entire writes; lazy builders capture sync-send time at the write boundary. */
  _enqueueWrite(build, session = this._session) {
    const task = this._writeChain.then(async () => {
      if (!session || session !== this._session) throw new ConnectionClosedError();
      const data = build();
      if (data) {
        let timer;
        try {
          await Promise.race([this._writeBytes(data), new Promise((_, reject) => {
            timer = setTimeout(() => reject(new RequestTimeoutError('Transport write timed out')), this.requestTimeoutMs);
          })]);
          this._lastSentMs = performance.now();
        } finally { clearTimeout(timer); }
      }
    });
    this._writeChain = task.catch(() => {});
    return task;
  }

  /** Bundled hardware profile selected automatically from INIT identity. */
  getPwmFrequencyOptions() { return getPwmFrequencyOptions(this.boardInfo); }
  supportsPwmFrequency() { return supportsPwmFrequency(this.boardInfo); }
  getMotorCurrentLimitOptions(index = 0) { return getMotorCurrentLimitOptions(this.boardInfo, index); }
  supportsMotorCurrentLimit(index = 0) { return supportsMotorCurrentLimit(this.boardInfo, index); }
  get boardProfile() { return getBoardProfile(this.boardInfo); }

  /** Check both hardware presence and firmware support without performing I/O. */
  supportsSensor(kind, index = 0) { return supportsBoardSensor(this.boardInfo, kind, index); }

  supportsTopic(topic, index = 0) { return supportsTopic(this.boardInfo, topic, index); }
  supportsMotorFaults(index = 0) { return supportsMotorFaults(this.boardInfo, index); }
  supportsMotorCurrent(index = 0) { return supportsMotorCurrent(this.boardInfo, index); }

  /** Serialize changes to one source, including cleanup racing with a replacement. */
  _telemetryOperation(key, operation) {
    const session = this._session;
    const task = (this._telemetryOperations.get(key) ?? Promise.resolve()).catch(() => {}).then(() => {
      if (!session || session !== this._session) throw new ConnectionClosedError();
      return operation();
    });
    this._telemetryOperations.set(key, task);
    const cleanup = () => { if (this._telemetryOperations.get(key) === task) this._telemetryOperations.delete(key); };
    task.then(cleanup, cleanup);
    return task;
  }

  /** Subscribe using the generated topic enum; one callback per topic/index/session. */
  async subscribe({ topic, index = 0, intervalMs, mode, trigger, delivery, pollIntervalMs, maxSilenceMs }, callback) {
    const configured = trigger !== undefined || delivery !== undefined || pollIntervalMs !== undefined || maxSilenceMs !== undefined;
    if (configured && (mode !== undefined || intervalMs !== undefined)) throw new RangeError('Use pollIntervalMs with trigger/delivery settings');
    if (mode === undefined) mode = SubscriptionMode.PERIODIC;
    trigger ??= SubscriptionTrigger.PERIODIC;
    delivery ??= SubscriptionDelivery.ALL;
    maxSilenceMs ??= 0;
    if (trigger === SubscriptionTrigger.ON_EVENT) pollIntervalMs ??= 0;
    if (!Object.values(SubscriptionMode).includes(mode)) throw new RangeError('Invalid subscription mode');
    if (typeof callback !== 'function') throw new TypeError('A sample callback is required');
    const key = topic + ':' + index;
    return this._telemetryOperation(key, async () => {
      const entry = { callback, closing: false, session: this._session };
      this._telemetryCandidates.set(key, entry);
      try {
        if (configured) await super.subscribe_configured(topic, index, pollIntervalMs, trigger, delivery, maxSilenceMs);
        else if (mode === SubscriptionMode.PERIODIC) await super.subscribe(topic, index, intervalMs);
        else await super.subscribe_with_mode(topic, index, intervalMs, mode);
      }
      catch (error) {
        // A lost ACK may still have installed a stream. Cancel that source so
        // a failed subscribe cannot leave an unreachable background subscription.
        if (error instanceof RequestTimeoutError && this._session === entry.session) {
          try { await this._unsubscribeTelemetry(topic, index); }
          catch (cleanupError) { if (this._session === entry.session) this._fatal(cleanupError); }
        }
        throw error;
      }
      finally { if (this._telemetryCandidates.get(key) === entry) this._telemetryCandidates.delete(key); }
      const owner = this;
      let closing;
      return Object.freeze({
        get active() { return !entry.closing && owner._session === entry.session && owner._telemetryListeners.get(key) === entry; },
        unsubscribe: () => {
          if (closing) return closing;
          if (this._telemetryListeners.get(key) !== entry || this._session !== entry.session) return Promise.resolve();
          entry.closing = true;
          closing = this._telemetryOperation(key, async () => {
            if (this._telemetryListeners.get(key) === entry) await this._unsubscribeTelemetry(topic, index);
          }).catch(error => { entry.closing = false; closing = null; throw error; });
          return closing;
        },
      });
    });
  }

  async _unsubscribeTelemetry(topic, index) {
    const session = this._session;
    try { await super.unsubscribe(topic, index); }
    catch (error) {
      // Without confirmation, closing the session lets the board watchdog clear
      // the stream instead of leaving it active after the owning view is gone.
      if (error instanceof RequestTimeoutError && this._session === session) this._fatal(error);
      throw error;
    }
  }

  _clearTelemetry() {
    for (const entry of this._telemetryListeners.values()) entry.closing = true;
    for (const entry of this._telemetryCandidates.values()) entry.closing = true;
    this._telemetryListeners.clear();
    this._telemetryCandidates.clear();
    this._telemetryOperations.clear();
  }

  /** Keep at most the latest waiting sample while an asynchronous callback runs. */
  _deliverTelemetry(key, entry, sample) {
    entry.latest = sample;
    if (entry.delivering) return;
    const deliver = () => {
      if (entry.closing || this._telemetryListeners.get(key) !== entry || !entry.latest) {
        entry.latest = null; entry.delivering = false; return;
      }
      const next = entry.latest;
      entry.latest = null;
      Promise.resolve().then(() => {
        if (!entry.closing && this._telemetryListeners.get(key) === entry) return entry.callback(next);
      }).catch(error => { this.lastTelemetryError = error; }).then(deliver);
    };
    entry.delivering = true;
    deliver();
  }

  /** Generated commands cannot bypass the INIT/READY gate. */
  async _request(command, payload, responseLength) {
    if (!this.ready) throw new ProtocolError('Controller is not ready; complete INIT first');
    if ([SUBSCRIBE, SUBSCRIBE_WITH_MODE, SUBSCRIBE_CONFIGURED, UNSUBSCRIBE].includes(command)) {
      if (!supportsTelemetry(this.boardInfo)) throw new ProtocolError('Subscriptions require firmware protocol 2.6 or newer');
      if (command === SUBSCRIBE_CONFIGURED && this.boardInfo.protocol_minor < 12)
        throw new ProtocolError('Subscription settings require firmware protocol 2.12 or newer');
      if (command === SUBSCRIBE_WITH_MODE && this.boardInfo.protocol_minor < 9)
        throw new ProtocolError('Subscription modes require firmware protocol 2.9 or newer');
      const [topic, index] = bytes(payload);
      if (topic === Topic.MOTOR_FAULTS && this.boardInfo.protocol_minor < 8)
        throw new ProtocolError('Motor faults require firmware protocol 2.8 or newer');
      if (topic === Topic.MOTOR_CURRENT && this.boardInfo.protocol_minor < 7)
        throw new ProtocolError('Motor current requires firmware protocol 2.7 or newer');
      if (this.boardProfile && !this.supportsTopic(topic, index))
        throw new ProtocolError('This board does not support the selected telemetry source');
      if ([SUBSCRIBE, SUBSCRIBE_WITH_MODE, SUBSCRIBE_CONFIGURED].includes(command) && this._heartbeatIntervalMs === null)
        throw new ProtocolError('Enable heartbeat monitoring before subscribing');
    }
    if (command === GET_IMU && !supportsImuRead(this.boardInfo))
      throw new ProtocolError('IMU readings require firmware protocol 2.5 or newer');
    if ([GET_PWM_FREQUENCY, SET_PWM_FREQUENCY].includes(command)) {
      if (this.boardInfo?.protocol_major !== 2 || this.boardInfo.protocol_minor < 13)
        throw new ProtocolError('PWM frequency configuration requires firmware protocol 2.13 or newer');
      const options = this.getPwmFrequencyOptions();
      if (this.boardProfile && !options) throw new ProtocolError('This board has no configurable PWM frequency');
      if (command === SET_PWM_FREQUENCY && options) {
        const data = bytes(payload);
        const frequency = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0, true);
        if (!options.supported_hz.includes(frequency)) throw new RangeError('PWM frequency is not allowed by this board');
      }
    }
    if ([GET_MOTOR_CURRENT_LIMIT, SET_MOTOR_CURRENT_LIMIT].includes(command)) {
      if (this.boardInfo?.protocol_major !== 2 || this.boardInfo.protocol_minor < 11)
        throw new ProtocolError('Current-limit setup requires firmware protocol 2.11 or newer');
      const data = bytes(payload), options = this.getMotorCurrentLimitOptions(data[0]);
      if (this.boardProfile && !options) throw new ProtocolError('This motor has no configurable current limit');
      if (command === SET_MOTOR_CURRENT_LIMIT && options &&
          (!options.supported_thresholds_ma.includes(data[2] | (data[3] << 8)) || (!data[1] && !options.can_disable)))
        throw new RangeError('Current-limit setting is not allowed by this board');
    }
    if (command === CLEAR_MOTOR_FAULTS && this.boardInfo?.protocol_minor < 10)
      throw new ProtocolError('Clearing motor faults requires firmware protocol 2.10 or newer');
    if ([GET_MOTOR_FAULTS, CLEAR_MOTOR_FAULTS].includes(command)) {
      if (this.boardInfo?.protocol_major !== 2 || this.boardInfo.protocol_minor < 8)
        throw new ProtocolError('Motor faults require firmware protocol 2.8 or newer');
      if (this.boardProfile && !this.supportsMotorFaults(bytes(payload)[0]))
        throw new ProtocolError('This motor has no fault reporting');
    }
    if (command === GET_MOTOR_CURRENT) {
      if (this.boardInfo?.protocol_major !== 2 || this.boardInfo.protocol_minor < 7)
        throw new ProtocolError('Motor current requires firmware protocol 2.7 or newer');
      if (this.boardProfile && !this.supportsMotorCurrent(bytes(payload)[0]))
        throw new ProtocolError('This motor has no current sensor');
    }
    if (command === GET_TEMPERATURE && !supportsTemperatureRead(this.boardInfo))
      throw new ProtocolError('Temperature readings require firmware protocol 2.4 or newer');
    const sensorKind = command === GET_TEMPERATURE ? 'temperature' : command === GET_IMU ? 'imu' : null;
    if (sensorKind && this.boardProfile && !this.supportsSensor(sensorKind, new Uint8Array(payload)[0]))
      throw new ProtocolError(`This board has no ${sensorKind === 'imu' ? 'IMU' : 'temperature'} sensor at that index`);
    if (POSITION_PID_COMMANDS.has(command) && !supportsPositionPidControl(this.boardInfo))
      throw new ProtocolError('Position PID requires firmware protocol 2.3 or newer');
    if (POSITION_COMMANDS.has(command) && !supportsPositionControl(this.boardInfo))
      throw new ProtocolError('Position control requires firmware protocol 2.2 or newer');
    const session = this._session;
    const response = await this._sendRequest(command, payload, responseLength, false);
    if (this._session !== session) throw new ConnectionClosedError();
    const data = bytes(payload);
    if (command === SET_HEARTBEAT_CONFIG) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      this._heartbeatIntervalMs = data[0] ? view.getUint32(1, true) / 5 : null;
      if (!data[0]) { this._subscriptionSamples.clear(); this._clearTelemetry(); }
      this._scheduleHeartbeat(session);
    } else if ([SUBSCRIBE, SUBSCRIBE_WITH_MODE, SUBSCRIBE_CONFIGURED].includes(command)) {
      // Activate at the ACK boundary, before the reader dispatches a coalesced event.
      const key = data[0] + ':' + data[1];
      const entry = this._telemetryCandidates.get(key);
      if (entry && !entry.closing && entry.session === session) this._telemetryListeners.set(key, entry);
      if (data[0] === Topic.ENCODER_ODOMETRY) this._subscriptionSamples.delete(data[1]);
      if (data[0] === Topic.PLATFORM_ODOMETRY) this._subscriptionSamples.delete(4);
    } else if (command === UNSUBSCRIBE) {
      const key = data[0] + ':' + data[1];
      const entry = this._telemetryListeners.get(key);
      if (entry) entry.closing = true;
      this._telemetryListeners.delete(key);
      if (data[0] === Topic.ENCODER_ODOMETRY) this._subscriptionSamples.delete(data[1]);
      if (data[0] === Topic.PLATFORM_ODOMETRY) this._subscriptionSamples.delete(4);
    } else if ([SUBSCRIBE_ODOMETRY, UNSUBSCRIBE_ODOMETRY].includes(command)) {
      const key = data[0] === 4 ? Topic.PLATFORM_ODOMETRY + ':0' : Topic.ENCODER_ODOMETRY + ':' + data[0];
      const entry = this._telemetryListeners.get(key);
      if (entry) entry.closing = true;
      this._telemetryListeners.delete(key);
      this._subscriptionSamples.delete(data[0]);
    }
    return response;
  }

  /** Check actual outgoing activity before sending the next correlated idle PING. */
  _scheduleHeartbeat(session) {
    clearTimeout(this._heartbeatTimer);
    if (session !== this._session || this._heartbeatIntervalMs === null) return;
    const delay = Math.max(5, this._heartbeatIntervalMs - (performance.now() - this._lastSentMs));
    this._heartbeatTimer = setTimeout(async () => {
      if (session !== this._session || this._heartbeatIntervalMs === null) return;
      try {
        if (this.ready && !this._heartbeatPending && performance.now() - this._lastSentMs >= this._heartbeatIntervalMs) {
          this._heartbeatPending = true;
          try { await this.ping(); }
          finally { if (session === this._session) this._heartbeatPending = false; }
        }
      } catch (error) { if (session === this._session) this._fatal(error); return; }
      this._scheduleHeartbeat(session);
    }, delay);
  }

  /** Return the latest legacy odometry sample without a request or an unbounded event queue.
   * @deprecated Legacy odometry subscriptions are retired. Use subscribe() callbacks with protocol 2.6+.
   */
  getSubscriptionSample(source) {
    if (!Number.isInteger(source) || source < 0 || source > 4) throw new TypeError('source must be 0..4');
    return this._subscriptionSamples.get(source) ?? null;
  }

  /** Register the expected response before writing so immediate replies cannot be lost. */
  _sendRequest(command, payload, responseLength, init) {
    const session = this._session;
    if (!session) return Promise.reject(new ConnectionClosedError());
    const id = this._allocateId();
    return new Promise((resolve, reject) => {
      const pending = { command, responseLength, resolve, reject, init, identity: null };
      pending.timer = setTimeout(() => {
        this._pending.delete(id); this._retired.add(id);
        reject(new RequestTimeoutError(`Timed out waiting for command 0x${command.toString(16)}, message ${id}`));
      }, init ? this.initTimeoutMs : this.requestTimeoutMs);
      this._pending.set(id, pending);
      this._enqueueWrite(() => this._pending.get(id) === pending ? frame(command, id, payload) : null, session)
        .catch((error) => { if (this._session === session) this._fatal(error); });
    });
  }

  /** A single reader owns framing for every command and asynchronous time-sync request. */
  async _readLoop(session) {
    try {
      while (this._session === session) {
        // Send queued sync replies before issuing another blocking proxy READ.
        await this._writeChain;
        if (this._session !== session) break;
        const needed = this._buffer.length ? this._buffer[0] + 1 - this._buffer.length : 1;
        const chunk = bytes(await this._readBytes(needed));
        if (this._session !== session) break;
        if (chunk.length) await this._consume(chunk);
        else await new Promise((resolve) => setTimeout(resolve, 1));
      }
    } catch (error) { if (this._session === session) this._fatal(error); }
  }

  /** Split fragmented/coalesced frames and bound incomplete frames by a fixed deadline. */
  async _consume(chunk) {
    const receivedUs = this.wallClock ? this.nowUnixUs() : 0n;
    const combined = new Uint8Array(this._buffer.length + chunk.length);
    combined.set(this._buffer); combined.set(chunk, this._buffer.length); this._buffer = combined;
    while (this._buffer.length) {
      if (this._buffer[0] < 3 || this._buffer[0] > 254) throw new ProtocolError('Invalid message length');
      const length = this._buffer[0] + 1;
      if (this._buffer.length < length) {
        if (!this._frameTimer) this._frameTimer = setTimeout(() => this._fatal(new ProtocolError('Incomplete response frame timed out')), this.frameTimeoutMs);
        return;
      }
      clearTimeout(this._frameTimer); this._frameTimer = null;
      const message = this._buffer.slice(0, length); this._buffer = this._buffer.slice(length);
      await this._message(message, receivedUs);
    }
  }

  /** Dispatch replies by command + ID; controller IDs occupy an independent namespace. */
  async _message(message, receivedUs) {
    const command = message[1], id = message[2] | message[3] << 8, payload = message.slice(4);
    if (command === TELEMETRY_EVENT) {
      if (id) throw new ProtocolError('Telemetry events must use message ID zero');
      let event;
      try { event = decodeTelemetryEvent(payload); }
      catch (error) { throw new ProtocolError(error.message); }
      if (!event || !this.ready) return;
      const { topic, index, sample } = event, key = topic + ':' + index;
      const entry = this._telemetryListeners.get(key);
      if (!entry || entry.closing) return;
      Object.freeze(sample);
      this._deliverTelemetry(key, entry, sample);
      return;
    }
    if ([ENCODER_ODOMETRY_EVENT, PLATFORM_ODOMETRY_EVENT].includes(command)) {
      const encoder = command === ENCODER_ODOMETRY_EVENT;
      if (id || payload.length !== (encoder ? 19 : 34) || (encoder && payload[0] > 3)) throw new ProtocolError('Malformed odometry event');
      const sample = encoder ? EncoderOdometrySample.decode(payload.slice(1)) : PlatformOdometrySample.decode(payload);
      if (![0, 1].includes(sample.clock_mode) || ![1, 2].includes(sample.clock_quality)) throw new ProtocolError('Invalid odometry clock metadata');
      if (this.ready) this._subscriptionSamples.set(encoder ? payload[0] : 4, sample);
      return;
    }
    if (!id) throw new ProtocolError('Message ID zero is reserved');
    if (command === TIME_SYNC_REQUEST) {
      if (!this.wallClock || payload.length) throw new ProtocolError('Unexpected time-sync request');
      await this._enqueueWrite(() => {
        const data = new ArrayBuffer(16), view = new DataView(data);
        view.setBigUint64(0, receivedUs, true);
        view.setBigUint64(8, this.nowUnixUs(), true);
        return frame(TIME_SYNC_RESPONSE, id, data);
      });
      return;
    }
    if (command === ERROR) {
      if (payload.length !== 2 || !payload[1]) throw new ProtocolError('Malformed ERROR response');
      const error = new ControllerError(payload[1], payload[0], id);
      if (payload[0] === TIME_SYNC_RESPONSE) { this.lastSyncError = error; return; }
      const pending = this._pending.get(id);
      if (!pending) return; // Late reply after timeout.
      if (pending.command !== payload[0]) throw new ProtocolError('ERROR refers to the wrong command');
      if ([ErrorCode.INIT_REQUIRED, ErrorCode.CLOCK_NOT_READY].includes(error.code)) {
        this.ready = false;
        clearTimeout(this._heartbeatTimer); this._heartbeatIntervalMs = null;
        this._subscriptionSamples.clear();
        this._clearTelemetry();
      }
      this._finish(id, error); return;
    }
    const pending = this._pending.get(id);
    if (!pending) return;
    if (command === READY && pending.init) {
      if (!pending.identity || payload.length !== 1 || payload[0] !== (this.wallClock ? 1 : 0)) throw new ProtocolError('Invalid READY response');
      this.clockMode = payload[0]; this.ready = true;
      this._finish(id, null, pending.identity); return;
    }
    if (command !== pending.command || payload.length !== pending.responseLength) throw new ProtocolError('Response command or payload length does not match its request');
    if (pending.init) {
      if (pending.identity) throw new ProtocolError('Duplicate INIT response');
      const identity = InitResponse.decode(payload);
      if (identity.protocol_major !== MIN_PROTOCOL_VERSION[0] || identity.protocol_minor < MIN_PROTOCOL_VERSION[1]) throw new ProtocolError('Incompatible controller protocol version');
      pending.identity = identity; this.boardInfo = identity;
    } else this._finish(id, null, payload);
  }

  /** Settle exactly one pending request and cancel its deadline. */
  _finish(id, error, value) {
    const pending = this._pending.get(id);
    if (!pending) return;
    this._pending.delete(id); clearTimeout(pending.timer);
    if (error) pending.reject(error); else pending.resolve(value);
  }

  /** End a session, rejecting every waiter and preventing queued writes after disconnect. */
  _endSession(error = new ConnectionClosedError()) {
    this._session = null; this.ready = false;
    this.boardInfo = null; this.clockMode = null;
    clearTimeout(this._heartbeatTimer); this._heartbeatTimer = null; this._heartbeatIntervalMs = null;
    this._heartbeatPending = false;
    this._subscriptionSamples.clear();
    this._clearTelemetry();
    clearTimeout(this._frameTimer); this._frameTimer = null;
    for (const id of this._pending.keys()) this._finish(id, error);
    this._buffer = new Uint8Array();
  }

  /** Report an unexpected loss and let the adapter cancel its physical I/O. */
  _fatal(error) {
    if (!this._session) return;
    this.lastError = error.message; this._endSession(error);
    void this.disconnect().catch(() => {});
    this.onDisconnect?.(error);
  }
}
