// File: kinisi_session.test.js
// Exercise real v2 session framing with controllable byte streams and independent replies.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { KinisiSession, ControllerError, RequestTimeoutError } from './kinisi_session.js';
import { INIT, READY, TIME_SYNC_REQUEST, TIME_SYNC_RESPONSE, ERROR,
  GET_ENCODER_VALUE, GET_ENCODER_ODOMETRY, GET_TIME_STATUS, InitResponse,
  EncoderOdometrySample, TimeStatus, MotorControllerState,
  PING, SET_HEARTBEAT_CONFIG, ENCODER_ODOMETRY_EVENT, GET_TEMPERATURE, ErrorCode } from './kinisi_commands.js';
import { Topic, SUBSCRIBE, UNSUBSCRIBE, TELEMETRY_EVENT, TemperatureSample, ImuTelemetrySample,
  PlatformOdometrySample, SUBSCRIBE_ODOMETRY, MotorCurrentSample } from './kinisi_commands.js';

/** Build fixture messages independently of the SDK frame encoder. */
function packet(command, id, payload = []) {
  const data = payload instanceof ArrayBuffer ? new Uint8Array(payload) : new Uint8Array(payload);
  return new Uint8Array([data.length + 3, command, id & 255, id >> 8, ...data]);
}
/** Give the promise-based read/write queues time to drain without sleeping. */
async function flush() { for (let i = 0; i < 40; i++) await Promise.resolve(); }
const clients = [];

function telemetry(topic, index, sample) {
  return packet(TELEMETRY_EVENT, 0, [topic, index, ...new Uint8Array(sample.encode())]);
}

class FakeClient extends KinisiSession {
  /** Start an in-memory endpoint that can split, delay, and reorder board replies. */
  constructor(options = {}) {
    let now = 1700000000000000n;
    super({ heartbeatTimeoutMs: null, nowUnixUs: () => (now += 100n), ...options });
    this.chunks = []; this.writes = []; this.waiter = null;
    this.syncs = 0; this.syncId = 400; this.handler = null;
    this.protocolMinor = options.protocolMinor ?? 1;
    this.boardMinor = options.boardMinor ?? 3;
    this.boardPatch = options.boardPatch ?? (this.boardMinor === 4 ? 0 : 1);
    clients.push(this);
  }
  /** Feed raw bytes into the production stream parser. */
  push(data) {
    if (this.waiter) { const resolve = this.waiter; this.waiter = null; resolve(data); }
    else this.chunks.push(data);
  }
  /** Suspend the single reader until bytes arrive or the client disconnects. */
  async _readBytes() {
    if (this.chunks.length) return this.chunks.shift();
    return new Promise((resolve) => { this.waiter = resolve; });
  }
  /** Reply with golden payloads; matching and codecs remain production code. */
  async _writeBytes(data) {
    this.writes.push(data.slice());
    if (this.handler) return this.handler(data);
    const command = data[1], id = data[2] | data[3] << 8;
    if (command === INIT) {
      this.initId = id;
      const identity = new InitResponse(1, 0, this.boardMinor, this.boardPatch, 2, this.protocolMinor, 0, 0x12345678, 0x90abcdef).encode();
      const response = packet(INIT, id, identity);
      // Fragment identity, then coalesce its end with the next message.
      this.push(response.slice(0, 2));
      this.push(new Uint8Array([...response.slice(2), ...packet(this.wallClock ? TIME_SYNC_REQUEST : READY, this.wallClock ? this.syncId : id, this.wallClock ? [] : [0])]));
    } else if (command === TIME_SYNC_RESPONSE) {
      this.syncs++;
      if (this.syncs < 3) this.push(packet(TIME_SYNC_REQUEST, ++this.syncId));
      else if (!this.ready) this.push(packet(READY, this.initId, [1]));
    } else if (command === GET_ENCODER_VALUE) this.push(packet(command, id, [0xef, 0xbe]));
    else if (command === GET_TIME_STATUS) this.push(packet(command, id, new TimeStatus(this.wallClock ? 1 : 0, 1, 30000, 9007199254740993n).encode()));
    else if (command === GET_ENCODER_ODOMETRY) this.push(packet(command, id, new EncoderOdometrySample(9007199254740993n, this.wallClock ? 1 : 0, 1, 1.25).encode()));
    else this.push(packet(command, id));
  }
  /** Connect only after the production handshake settles. */
  async connect() { await this._startSession(); }
  /** Wake any blocked read while cancelling every session waiter. */
  async disconnect() { this._endSession(); this.push(new Uint8Array()); }
}

afterEach(async () => {
  for (const client of clients.splice(0)) await client.disconnect();
  await flush(); vi.useRealTimers();
});

describe('API v2 session', () => {
  it('selects the profile after INIT and clears it after disconnect', async () => {
    const c = new FakeClient({ protocolMinor: 5, boardMinor: 4 });
    expect(c.boardProfile).toBeNull(); expect(c.supportsSensor('imu')).toBe(false);
    await c.connect();
    expect(c.boardProfile.board).toEqual({ model: 1, revision: '0.4.0' });
    expect(c.boardProfile.resources.motors).toBe(4);
    expect(c.supportsSensor('temperature')).toBe(true); expect(c.supportsSensor('imu')).toBe(true);
    await c.disconnect();
    expect(c.boardProfile).toBeNull(); expect(c.supportsSensor('imu')).toBe(false);
  });
  it('blocks sensor requests on known legacy hardware before I/O', async () => {
    const c = new FakeClient({ protocolMinor: 5, boardMinor: 3, boardPatch: 0 }); await c.connect();
    const count = c.writes.length;
    expect(c.boardProfile.resources.motors).toBe(4);
    expect(c.supportsSensor('temperature')).toBe(false); expect(c.supportsSensor('imu')).toBe(false);
    await expect(c.get_temperature(0)).rejects.toThrow('no temperature sensor');
    await expect(c.get_imu(0)).rejects.toThrow('no IMU sensor');
    expect(c.writes).toHaveLength(count);
    expect(await c.get_encoder_value(0)).toBe(0xbeef);
  });
  it('keeps unknown boards connected without guessing a profile', async () => {
    const c = new FakeClient({ protocolMinor: 5, boardMinor: 99 }); await c.connect();
    expect(c.boardProfile).toBeNull(); expect(c.supportsSensor('imu')).toBe(false);
    expect(await c.get_encoder_value(0)).toBe(0xbeef);
  });
  it.each([1, 2, 3, 4])('keeps protocol 2.%s usable while rejecting IMU without I/O', async protocolMinor => {
    const c = new FakeClient({ protocolMinor }); await c.connect();
    const count = c.writes.length;
    await expect(c.get_imu(0)).rejects.toThrow('require firmware protocol 2.5');
    expect(c.writes).toHaveLength(count);
    expect(await c.get_encoder_value(0)).toBe(0xbeef);
  });
  it('reads a fragmented 48-byte IMU sample over a ready 2.5 session', async () => {
    const c = new FakeClient({ protocolMinor: 5, boardMinor: 4 }); await c.connect();
    c.handler = request => {
      expect([...request]).toEqual([4, 0x51, 2, 0, 0]);
      const payload = new ArrayBuffer(48);
      [0, -1, 9.80665, 0.125, -0.25, 0.5].forEach((value, i) => new DataView(payload).setFloat64(i * 8, value, true));
      const reply = packet(0x51, 2, payload);
      for (let i = 0; i < reply.length; i += 3) c.push(reply.slice(i, i + 3));
    };
    await expect(c.get_imu(0)).resolves.toMatchObject({ acceleration_y: -1, acceleration_z: 9.80665, angular_velocity_z: 0.5 });
  });
  it.each([ErrorCode.SAMPLE_NOT_AVAILABLE, ErrorCode.SENSOR_NOT_AVAILABLE, ErrorCode.INTERNAL_ERROR])(
    'preserves IMU error %s and keeps the session usable', async code => {
      const c = new FakeClient({ protocolMinor: 5, boardMinor: 4 }); await c.connect();
      c.handler = request => {
        const id = request[2] | request[3] << 8;
        c.push(request[1] === 0x51 ? packet(ERROR, id, [0x51, code]) : packet(request[1], id));
      };
      await expect(c.get_imu(0)).rejects.toMatchObject({ name: 'ControllerError', code, command: 0x51, messageId: 2 });
      await expect(c.ping()).resolves.toBeUndefined();
    });
  it.each([1, 2, 3])('keeps protocol 2.%s usable while rejecting temperature without I/O', async protocolMinor => {
    const c = new FakeClient({ protocolMinor }); await c.connect();
    const count = c.writes.length;
    await expect(c.get_temperature(0)).rejects.toThrow('require firmware protocol 2.4');
    expect(c.writes).toHaveLength(count);
    expect(await c.get_encoder_value(0)).toBe(0xbeef);
  });

  it('reads a fragmented signed temperature response over a ready 2.4 session', async () => {
    const c = new FakeClient({ protocolMinor: 4, boardMinor: 4 }); await c.connect();
    c.handler = request => {
      expect([...request]).toEqual([4, 0x50, 2, 0, 0]);
      const response = packet(0x50, 2, [0, 0, 0, 0, 0, 0, 0xb0, 0xbf]); // -0.0625 C
      c.push(response.slice(0, 6)); c.push(response.slice(6));
    };
    await expect(c.get_temperature(0)).resolves.toBe(-0.0625);
  });

  it.each([ErrorCode.SAMPLE_NOT_AVAILABLE, ErrorCode.SENSOR_NOT_AVAILABLE, ErrorCode.INTERNAL_ERROR])(
    'preserves temperature error %s and keeps the session usable', async code => {
      const c = new FakeClient({ protocolMinor: 4, boardMinor: 4 }); await c.connect();
      c.handler = request => {
        const id = request[2] | request[3] << 8;
        c.push(request[1] === GET_TEMPERATURE
          ? packet(ERROR, id, [GET_TEMPERATURE, code]) : packet(request[1], id));
      };
      await expect(c.get_temperature(0)).rejects.toMatchObject({ name: 'ControllerError', code, command: 0x50, messageId: 2 });
      expect(c.ready).toBe(true);
      await expect(c.ping()).resolves.toBeUndefined();
    });

  it('gates position PID initialization on 2.3 while keeping legacy position commands', async () => {
    const old = new FakeClient({ protocolMinor: 2 }); await old.connect();
    const count = old.writes.length;
    await expect(old.initialize_motor_position_pid_controller(0, 2, 1, 0.02, 0.1, 0.2, 1)).rejects.toThrow('requires firmware protocol 2.3');
    await expect(old.initialize_platform_position_pid_controller(1, 2, 0.2, 0.5, 0.01, 0.03, 0, 0, 0.2, 0, 0, 0.5)).rejects.toThrow('requires firmware protocol 2.3');
    expect(old.writes).toHaveLength(count);
    const c = new FakeClient({ protocolMinor: 3 }); await c.connect();
    await c.initialize_motor_position_pid_controller(0, 2, 1, 0.02, 0.1, 0.2, 1);
    expect(c.writes.at(-1)[1]).toBe(0x10);
    await c.initialize_platform_position_pid_controller(1, 2, 0.2, 0.5, 0.01, 0.03, 0.1, 0.2, 0.2, 0.3, 0.4, 0.5);
    expect(c.writes.at(-1)[1]).toBe(0x4e);
  });
  it('keeps 2.1 connections usable but rejects position commands before writing', async () => {
    const c = new FakeClient(); await c.connect();
    const count = c.writes.length;
    await expect(c.set_motor_position(0, 1)).rejects.toThrow('requires firmware protocol 2.2');
    expect(c.writes).toHaveLength(count);
    expect(await c.get_encoder_value(0)).toBe(0xbeef);
  });
  it('uses the shared session for acknowledged 2.2 position commands', async () => {
    const c = new FakeClient({ protocolMinor: 2 }); await c.connect();
    await c.initialize_motor_position_controller(0, 2, 1, 0.02);
    expect(c.writes.at(-1)[1]).toBe(0x0c);
    await c.set_platform_position(1, -2, 0.5);
    expect(c.writes.at(-1)[1]).toBe(0x4d);
  });
  it('sends idle pings, suppresses them during traffic, and stops after disable', async () => {
    vi.useFakeTimers();
    const c = new FakeClient({ heartbeatTimeoutMs: 500 });
    await c.connect();
    expect([...c.writes.at(-1).slice(4)]).toEqual([1, 244, 1, 0, 0]);
    expect(c.writes.at(-1)[1]).toBe(SET_HEARTBEAT_CONFIG);
    await vi.advanceTimersByTimeAsync(100);
    expect(c.writes.at(-1)[1]).toBe(PING);
    const pings = c.writes.filter(d => d[1] === PING).length;
    for (let i = 0; i < 5; i++) {
      await c.get_encoder_value(0);
      await vi.advanceTimersByTimeAsync(40);
    }
    expect(c.writes.filter(d => d[1] === PING)).toHaveLength(pings);
    await c.set_heartbeat_config(false, 500);
    const count = c.writes.length;
    await vi.advanceTimersByTimeAsync(500);
    expect(c.writes).toHaveLength(count);
  });

  it('stores the latest ID-zero sample without consuming a pending GET response', async () => {
    const c = new FakeClient(); await c.connect();
    c.handler = () => {};
    const reply = c.get_encoder_value(0); await flush();
    const id = c.writes.at(-1)[2];
    for (const timestamp of [123n, 456n]) {
      const sample = new Uint8Array(new EncoderOdometrySample(timestamp, 1, 1, 2.5).encode());
      c.push(packet(ENCODER_ODOMETRY_EVENT, 0, [0, ...sample]));
    }
    c.push(packet(GET_ENCODER_VALUE, id, [42, 0]));
    expect(await reply).toBe(42);
    expect(c.getSubscriptionSample(0).timestamp_us).toBe(456n);
    await c.disconnect();
    expect(c.getSubscriptionSample(0)).toBeNull();
  });

  it('closes a session when the heartbeat ACK is lost', async () => {
    vi.useFakeTimers();
    const c = new FakeClient({ heartbeatTimeoutMs: 500, requestTimeoutMs: 200 });
    await c.connect(); c.handler = () => {};
    await vi.advanceTimersByTimeAsync(301);
    expect(c.ready).toBe(false);
    expect(c.lastError).toContain('Timed out');
  });

  it('performs fragmented INIT, three clock replies and READY before commands', async () => {
    const c = new FakeClient();
    await expect(c.get_encoder_value(0)).rejects.toThrow('not ready');
    await c.connect();
    expect(c.ready).toBe(true); expect(c.boardInfo.board_patch).toBe(1);
    expect([...c.writes[0]]).toEqual([11, 0x70, 1, 0, 2, 2, 6, 0, 2, 1, 0, 3]);
    expect(c.syncs).toBe(3);
    for (const data of c.writes.filter((d) => d[1] === TIME_SYNC_RESPONSE)) {
      const view = new DataView(data.buffer);
      expect(view.getBigUint64(12, true)).toBeGreaterThanOrEqual(view.getBigUint64(4, true));
    }
    expect(await c.get_encoder_value(0)).toBe(0xbeef);
    expect((await c.get_encoder_odometry(0)).timestamp_us).toBe(9007199254740993n);
    expect((await c.get_time_status()).last_sync_age_us).toBe(9007199254740993n);
  });

  it('supports uptime and never advertises wall-clock capability in that mode', async () => {
    const c = new FakeClient({ wallClock: false }); await c.connect();
    expect(c.clockMode).toBe(0); expect(c.syncs).toBe(0); expect(c.writes[0][11]).toBe(2);
  });

  it('responds to periodic sync while idle without another READY', async () => {
    const c = new FakeClient(); await c.connect();
    c.push(packet(TIME_SYNC_REQUEST, 501)); await flush();
    const last = c.writes.at(-1);
    expect([...last.slice(0, 4)]).toEqual([19, TIME_SYNC_RESPONSE, 245, 1]);
    expect(c.ready).toBe(true); expect(c.syncs).toBe(4);
  });

  it('routes out-of-order responses and isolates controller IDs and sync errors', async () => {
    const c = new FakeClient(); await c.connect(); c.handler = () => {};
    const first = c.get_encoder_value(0), second = c.get_encoder_value(1);
    await flush();
    const a = c.writes.at(-2)[2], b = c.writes.at(-1)[2];
    c.push(packet(TIME_SYNC_REQUEST, a)); await flush();
    c.push(packet(ERROR, a, [TIME_SYNC_RESPONSE, 2]));
    c.push(packet(GET_ENCODER_VALUE, b, [2, 0]));
    c.push(packet(GET_ENCODER_VALUE, a, [1, 0]));
    expect(await second).toBe(2); expect(await first).toBe(1);
    expect(c.lastSyncError).toBeInstanceOf(ControllerError);
  });

  it('waits for setter ACKs and returns structured controller errors', async () => {
    const c = new FakeClient({ wallClock: false }); await c.connect();
    c.handler = (d) => c.push(packet(ERROR, d[2], [d[1], 5]));
    const error = await c.stop_motor(0).catch((e) => e);
    expect(error).toMatchObject({ code: 5, command: 3, messageId: 2 });
    expect(c.ready).toBe(true);
    c.handler = (d) => c.push(packet(d[1], d[2]));
    await c.set_controller_frequency(1000);
    expect([...c.writes.at(-1)]).toEqual([5, 10, 3, 0, 232, 3]);
  });

  it('wraps IDs without zero and retires timed-out IDs until reconnect', async () => {
    vi.useFakeTimers();
    const c = new FakeClient({ wallClock: false, requestTimeoutMs: 10 }); await c.connect();
    c._nextId = 65535;
    await c.stop_motor(0); await c.stop_motor(0);
    expect([...c.writes.at(-2).slice(2, 4)]).toEqual([255, 255]);
    expect([...c.writes.at(-1).slice(2, 4)]).toEqual([1, 0]);
    c.handler = () => {};
    const timedOut = c.stop_motor(0).catch((e) => e); await flush();
    await vi.advanceTimersByTimeAsync(11);
    expect(await timedOut).toBeInstanceOf(RequestTimeoutError);
    c._nextId = 2;
    const pending = c.stop_motor(0); await flush();
    expect(c.writes.at(-1)[2]).toBe(3);
    c.push(packet(3, 2)); c.push(packet(3, 3)); await pending;
  });

  it('rejects malformed replies, bounds partial frames, and cancels pending work', async () => {
    vi.useFakeTimers();
    const c = new FakeClient({ wallClock: false, frameTimeoutMs: 10 }); await c.connect();
    c.handler = () => {};
    const result = c.get_encoder_value(0).catch((e) => e); await flush();
    c.push(new Uint8Array([5, GET_ENCODER_VALUE])); await flush();
    await vi.advanceTimersByTimeAsync(11);
    expect((await result).message).toContain('Incomplete'); expect(c.ready).toBe(false);
  });

  it('times out if identity is received without READY', async () => {
    vi.useFakeTimers();
    const c = new FakeClient({ wallClock: false, initTimeoutMs: 10 });
    c.handler = (d) => c.push(packet(INIT, d[2], new InitResponse(1, 0, 3, 0, 2, 1, 0, 0, 0).encode()));
    const result = c.connect().catch((e) => e); await flush();
    expect(c.ready).toBe(false);
    await vi.advanceTimersByTimeAsync(11);
    expect(await result).toBeInstanceOf(RequestTimeoutError);
  });

  it('never sends a queued command after disconnect', async () => {
    const c = new FakeClient({ wallClock: false }); await c.connect();
    const count = c.writes.length;
    const result = c.stop_motor(0).catch((e) => e);
    await c.disconnect(); await flush();
    expect((await result).name).toBe('ConnectionClosedError'); expect(c.writes).toHaveLength(count);
  });
});

describe('generated payload codecs', () => {
  it('preserves typed-array offsets, signed fields and float64 layout', () => {
    const state = new MotorControllerState(-1, 1, 2, 3, -12.5, 5, 6, 7);
    const encoded = state.encode();
    const padded = new Uint8Array(70); padded.set(new Uint8Array(encoded), 5);
    expect(MotorControllerState.decode(padded.subarray(5, 62))).toEqual(state);
    expect(() => MotorControllerState.decode(new ArrayBuffer(58))).toThrow('Expected 57');
    expect(() => new EncoderOdometrySample(Number.MAX_SAFE_INTEGER + 1, 0, 1, 0).encode()).toThrow('bigint');
  });
});

describe('Generic telemetry subscriptions', () => {
  const options = { protocolMinor: 7, boardMinor: 4, heartbeatTimeoutMs: 500 };
  const imu = stamp => new ImuTelemetrySample(stamp, 0, 1, 1, 2, 3, 4, 5, 6);
  it.each([
    [Topic.ENCODER_ODOMETRY, 0, 100, new EncoderOdometrySample(123n, 0, 1, 2.5)],
    [Topic.PLATFORM_ODOMETRY, 0, 100, new PlatformOdometrySample(123n, 0, 1, 1, 2, 3)],
    [Topic.TEMPERATURE, 0, 1000, new TemperatureSample(123n, 0, 1, -12.5)],
    [Topic.IMU, 0, 20, imu(123n)],
    ...[0, 1, 2, 3].map(index => [Topic.MOTOR_CURRENT, index, 20, new MotorCurrentSample(123n, 0, 1, index + .25)]),
  ])('encodes enum topic %s and dispatches its typed sample', async (topic, index, intervalMs, sample) => {
    const c = new FakeClient(options); await c.connect();
    const listener = vi.fn();
    const sub = await c.subscribe({ topic, index, intervalMs }, listener);
    const wire = c.writes.at(-1);
    expect([...wire.slice(0, 2)]).toEqual([9, SUBSCRIBE]);
    expect([...wire.slice(4, 6)]).toEqual([topic, index]);
    expect(new DataView(wire.buffer).getUint32(6, true)).toBe(intervalMs);
    expect(sub.active).toBe(true);
    const data = telemetry(topic, index, sample);
    c.push(data.slice(0, 7)); c.push(data.slice(7)); await flush();
    expect(listener).toHaveBeenCalledExactlyOnceWith(sample);
    expect(Object.isFrozen(listener.mock.calls[0][0])).toBe(true);
    await sub.unsubscribe(); await sub.unsubscribe();
    expect(c.writes.filter(w => w[1] === UNSUBSCRIBE)).toHaveLength(1);
    expect(sub.active).toBe(false);
    c.push(data); await flush(); expect(listener).toHaveBeenCalledTimes(1);
  });
  it('rejects unsupported firmware, hardware, indices and intervals before sending', async () => {
    const old = new FakeClient({ ...options, protocolMinor: 5 }); await old.connect();
    let count = old.writes.length;
    await expect(old.subscribe({ topic: Topic.IMU, intervalMs: 20 }, vi.fn())).rejects.toThrow('protocol 2.6');
    expect(old.writes).toHaveLength(count);
    const c = new FakeClient(options); await c.connect(); count = c.writes.length;
    for (const parameters of [{ topic: 'IMU', intervalMs: 20 }, { topic: 255, intervalMs: 20 },
      { topic: Topic.PLATFORM_ODOMETRY, index: 1, intervalMs: 100 },
      { topic: Topic.TEMPERATURE, index: 1, intervalMs: 1000 },
      { topic: Topic.TEMPERATURE, intervalMs: 249 }, { topic: Topic.IMU, intervalMs: NaN },
      { topic: Topic.IMU, intervalMs: 10.5 }, { topic: Topic.IMU, intervalMs: 3600001 }]) {
      await expect(c.subscribe(parameters, vi.fn())).rejects.toThrow();
    }
    expect(c.writes).toHaveLength(count);
    await c.set_heartbeat_config(false, 500); count = c.writes.length;
    await expect(c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, vi.fn())).rejects.toThrow('heartbeat');
    expect(c.writes).toHaveLength(count);
  });
  it('gates current pulls and subscriptions on protocol 2.7 even for unknown boards', async () => {
    for (const boardMinor of [4, 99]) {
      const c = new FakeClient({ ...options, boardMinor, protocolMinor: 6 }); await c.connect();
      const count = c.writes.length;
      await expect(c.get_motor_current(0)).rejects.toThrow('protocol 2.7');
      await expect(c.subscribe({ topic: Topic.MOTOR_CURRENT, intervalMs: 100 }, vi.fn())).rejects.toThrow('protocol 2.7');
      await expect(c.unsubscribe(Topic.MOTOR_CURRENT, 0)).rejects.toThrow('protocol 2.7');
      expect(c.writes).toHaveLength(count);
    }
    const c = new FakeClient({ ...options, boardMinor: 3, boardPatch: 0 }); await c.connect();
    const count = c.writes.length;
    await expect(c.get_motor_current(0)).rejects.toThrow('no current sensor');
    await expect(c.subscribe({ topic: Topic.MOTOR_CURRENT, intervalMs: 100 }, vi.fn())).rejects.toThrow('does not support');
    expect(c.writes).toHaveLength(count);
  });
  it('delivers a current pull and preserves saturation error identity', async () => {
    const c = new FakeClient(options); await c.connect();
    c.handler = d => {
      const value = new ArrayBuffer(8); new DataView(value).setFloat64(0, d[4] + .125, true);
      c.push(packet(d[1], d[2] | d[3] << 8, value));
    };
    for (let index = 0; index < 4; index++) expect(await c.get_motor_current(index)).toBe(index + .125);
    c.handler = d => c.push(packet(ERROR, d[2] | d[3] << 8, [d[1], ErrorCode.SAMPLE_OUT_OF_RANGE]));
    await expect(c.get_motor_current(0)).rejects.toMatchObject({ code: ErrorCode.SAMPLE_OUT_OF_RANGE, command: 0x52 });
  });
  it('replaces a listener without letting an old handle remove the replacement', async () => {
    const c = new FakeClient(options); await c.connect();
    const first = vi.fn(), second = vi.fn();
    const a = await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, first);
    const b = await c.subscribe({ topic: Topic.IMU, intervalMs: 30 }, second);
    expect(a.active).toBe(false); await a.unsubscribe();
    expect(c.writes.filter(w => w[1] === UNSUBSCRIBE)).toHaveLength(0);
    c.push(telemetry(Topic.IMU, 0, imu(1n))); await flush();
    expect(first).not.toHaveBeenCalled(); expect(second).toHaveBeenCalledOnce();
    expect(b.active).toBe(true);
  });
  it('delivers an event coalesced with the subscribe ACK', async () => {
    const c = new FakeClient(options); await c.connect();
    const listener = vi.fn(), sample = imu(42n);
    c.handler = d => c.push(new Uint8Array([
      ...packet(d[1], d[2] | d[3] << 8), ...telemetry(Topic.IMU, 0, sample),
    ]));
    await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, listener);
    await flush();
    expect(listener).toHaveBeenCalledExactlyOnceWith(sample);
  });
  it('serializes overlapping subscribe and unsubscribe requests', async () => {
    const c = new FakeClient(options); await c.connect();
    const first = c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, vi.fn());
    const second = c.subscribe({ topic: Topic.IMU, intervalMs: 30 }, vi.fn());
    const a = await first, b = await second;
    await a.unsubscribe(); await b.unsubscribe();
    expect(c.writes.filter(w => [SUBSCRIBE, UNSUBSCRIBE].includes(w[1])).map(w => w[1])).toEqual([SUBSCRIBE, SUBSCRIBE, UNSUBSCRIBE]);
  });
  it('keeps the previous listener after a rejected replacement and allows unsubscribe retry', async () => {
    const c = new FakeClient(options); await c.connect();
    const listener = vi.fn();
    const sub = await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, listener);
    c.handler = d => c.push(packet(ERROR, d[2] | d[3] << 8, [d[1], ErrorCode.INTERNAL_ERROR]));
    await expect(c.subscribe({ topic: Topic.IMU, intervalMs: 30 }, vi.fn())).rejects.toThrow('INTERNAL_ERROR');
    expect(sub.active).toBe(true);
    c.push(telemetry(Topic.IMU, 0, imu(1n))); await flush();
    expect(listener).toHaveBeenCalledOnce();
    await expect(sub.unsubscribe()).rejects.toThrow('INTERNAL_ERROR');
    expect(sub.active).toBe(true);
    c.handler = null; await sub.unsubscribe(); expect(sub.active).toBe(false);
  });
  it('cancels an unconfirmed subscription after its ACK times out', async () => {
    vi.useFakeTimers();
    const c = new FakeClient({ ...options, requestTimeoutMs: 20 }); await c.connect();
    c.handler = d => { if (d[1] !== SUBSCRIBE) c.push(packet(d[1], d[2] | d[3] << 8)); };
    const result = c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, vi.fn()).catch(error => error);
    await flush(); await vi.advanceTimersByTimeAsync(21);
    expect(await result).toBeInstanceOf(RequestTimeoutError);
    expect(c.writes.at(-1)[1]).toBe(UNSUBSCRIBE);
    expect(c._telemetryListeners.size).toBe(0);
    expect(c.ready).toBe(true);
  });
  it('closes the session if unsubscribe cannot be confirmed', async () => {
    vi.useFakeTimers();
    const c = new FakeClient({ ...options, requestTimeoutMs: 20 }); await c.connect();
    const sub = await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, vi.fn());
    c.handler = () => {};
    const result = sub.unsubscribe().catch(error => error);
    await flush(); await vi.advanceTimersByTimeAsync(21);
    expect(await result).toBeInstanceOf(RequestTimeoutError);
    expect(c.ready).toBe(false); expect(sub.active).toBe(false);
  });
  it('coalesces slow callbacks to the latest waiting sample and allows commands inside them', async () => {
    const c = new FakeClient(options); await c.connect();
    let release;
    const blocked = new Promise(resolve => { release = resolve; });
    const listener = vi.fn(async () => { await c.ping(); await blocked; });
    await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, listener);
    c.push(telemetry(Topic.IMU, 0, imu(1n))); await flush();
    c.push(telemetry(Topic.IMU, 0, imu(2n))); await flush();
    c.push(telemetry(Topic.IMU, 0, imu(3n))); await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    release(); await flush(); expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0].timestamp_us).toBe(3n);
    expect(c.ready).toBe(true);
  });
  it('contains callback failures and ignores future unknown topics', async () => {
    const c = new FakeClient(options); await c.connect();
    await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, () => { throw new Error('application failure'); });
    c.push(telemetry(Topic.IMU, 0, imu(1n))); await flush();
    expect(c.lastTelemetryError.message).toBe('application failure');
    c.push(packet(TELEMETRY_EVENT, 0, [200, 0, 1, 2])); await flush();
    expect(c.ready).toBe(true); await c.ping();
  });
  it('clears subscriptions on heartbeat disable, disconnect and legacy replacement', async () => {
    const c = new FakeClient(options); await c.connect(); const listener = vi.fn();
    const a = await c.subscribe({ topic: Topic.ENCODER_ODOMETRY, intervalMs: 100 }, listener);
    await c.subscribe_odometry(0, 100); expect(c.writes.at(-1)[1]).toBe(SUBSCRIBE_ODOMETRY);
    expect(a.active).toBe(false);
    const b = await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, listener);
    await c.set_heartbeat_config(false, 500); expect(b.active).toBe(false);
    await c.set_heartbeat_config(true, 500);
    const d = await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, listener);
    await c.disconnect(); expect(d.active).toBe(false);
    await c.connect(); c.push(telemetry(Topic.IMU, 0, imu(1n))); await flush();
    expect(listener).not.toHaveBeenCalled();
    const count = c.writes.length; await d.unsubscribe(); expect(c.writes).toHaveLength(count);
  });
  it.each(['length', 'clock', 'nan', 'id'])('rejects malformed %s telemetry', async kind => {
    const c = new FakeClient(options); await c.connect();
    await c.subscribe({ topic: Topic.IMU, intervalMs: 20 }, vi.fn());
    const sample = imu(1n);
    if (kind === 'clock') sample.clock_quality = 0;
    if (kind === 'nan') sample.acceleration_x = NaN;
    let frame = telemetry(Topic.IMU, 0, sample);
    if (kind === 'id') frame[2] = 1;
    if (kind === 'length') { frame = frame.slice(0, -1); frame[0]--; }
    c.push(frame); await flush(); expect(c.ready).toBe(false);
  });
});
