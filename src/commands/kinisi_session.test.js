// File: kinisi_session.test.js
// Exercise real v2 session framing with controllable byte streams and independent replies.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { KinisiSession, ControllerError, RequestTimeoutError } from './kinisi_session.js';
import { INIT, READY, TIME_SYNC_REQUEST, TIME_SYNC_RESPONSE, ERROR,
  GET_ENCODER_VALUE, GET_ENCODER_ODOMETRY, GET_TIME_STATUS, InitResponse,
  EncoderOdometrySample, TimeStatus, MotorControllerState } from './kinisi_commands.js';

/** Build fixture messages independently of the SDK frame encoder. */
function packet(command, id, payload = []) {
  const data = payload instanceof ArrayBuffer ? new Uint8Array(payload) : new Uint8Array(payload);
  return new Uint8Array([data.length + 3, command, id & 255, id >> 8, ...data]);
}
/** Give the promise-based read/write queues time to drain without sleeping. */
async function flush() { for (let i = 0; i < 40; i++) await Promise.resolve(); }
const clients = [];

class FakeClient extends KinisiSession {
  /** Start an in-memory endpoint that can split, delay, and reorder board replies. */
  constructor(options = {}) {
    let now = 1700000000000000n;
    super({ nowUnixUs: () => (now += 100n), ...options });
    this.chunks = []; this.writes = []; this.waiter = null;
    this.syncs = 0; this.syncId = 400; this.handler = null;
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
      const identity = new InitResponse(1, 0, 3, 1, 2, 0, 0, 0x12345678, 0x90abcdef).encode();
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
  it('performs fragmented INIT, three clock replies and READY before commands', async () => {
    const c = new FakeClient();
    await expect(c.get_encoder_value(0)).rejects.toThrow('not ready');
    await c.connect();
    expect(c.ready).toBe(true); expect(c.boardInfo.board_patch).toBe(1);
    expect([...c.writes[0]]).toEqual([11, 0x70, 1, 0, 2, 2, 0, 0, 2, 0, 0, 1]);
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
    expect(c.clockMode).toBe(0); expect(c.syncs).toBe(0); expect(c.writes[0][11]).toBe(0);
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
    c.handler = (d) => c.push(packet(INIT, d[2], new InitResponse(1, 0, 3, 0, 2, 0, 0, 0, 0).encode()));
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
