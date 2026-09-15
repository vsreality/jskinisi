// File: kinisi_session.js
// Shared API-v2 framing, readiness and clock exchange for serial and proxy transports.
import { Commands, INIT, READY, ERROR, TIME_SYNC_REQUEST, TIME_SYNC_RESPONSE,
  SDK_VERSION, PROTOCOL_VERSION, InitResponse, ErrorCode, ErrorDescriptions,
  SET_HEARTBEAT_CONFIG, UNSUBSCRIBE_ODOMETRY, ENCODER_ODOMETRY_EVENT, PLATFORM_ODOMETRY_EVENT,
  EncoderOdometrySample, PlatformOdometrySample } from './kinisi_commands.js';

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
    this._retired.clear(); this._writeChain = Promise.resolve();
    const session = {}; this._session = session;
    const init = this._sendRequest(INIT, new Uint8Array([2, ...SDK_VERSION, ...PROTOCOL_VERSION, this.wallClock ? 3 : 2]), InitResponse.getSize(), true);
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

  /** Generated commands cannot bypass the INIT/READY gate. */
  async _request(command, payload, responseLength) {
    if (!this.ready) throw new ProtocolError('Controller is not ready; complete INIT first');
    const session = this._session;
    const response = await this._sendRequest(command, payload, responseLength, false);
    if (this._session !== session) throw new ConnectionClosedError();
    const data = bytes(payload);
    if (command === SET_HEARTBEAT_CONFIG) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      this._heartbeatIntervalMs = data[0] ? view.getUint32(1, true) / 5 : null;
      if (!data[0]) this._subscriptionSamples.clear();
      this._scheduleHeartbeat(session);
    } else if (command === UNSUBSCRIBE_ODOMETRY) this._subscriptionSamples.delete(data[0]);
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

  /** Return the latest streamed sample without a request or an unbounded event queue. */
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
      if (identity.protocol_major !== PROTOCOL_VERSION[0] || identity.protocol_minor < PROTOCOL_VERSION[1]) throw new ProtocolError('Incompatible controller protocol version');
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
    clearTimeout(this._heartbeatTimer); this._heartbeatTimer = null; this._heartbeatIntervalMs = null;
    this._heartbeatPending = false;
    this._subscriptionSamples.clear();
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
