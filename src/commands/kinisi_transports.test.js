// File: kinisi_transports.test.js
// Exercise both real adapters through browser stream and proxy-opcode fixtures.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KinisiClient } from './kinisi_client.js';
import { KinisiWebSocketClient } from './kinisi_ws_client.js';
import { InitResponse, INIT, READY, TIME_SYNC_REQUEST, TIME_SYNC_RESPONSE } from './kinisi_commands.js';

/** Construct independent controller frames. */
function packet(command, id, payload = []) {
  return new Uint8Array([payload.length + 3, command, id & 255, id >> 8, ...payload]);
}
/** Minimal controller with initial and unsolicited sync, used behind both adapters. */
class Board {
  constructor(output) { this.output = output; this.writes = []; this.syncs = 0; this.syncId = 800; }
  receive(data) {
    this.writes.push(data.slice());
    const command = data[1], id = data[2] | data[3] << 8;
    if (command === INIT) {
      this.initId = id; this.wall = Boolean(data[11]);
      this.output(packet(INIT, id, new Uint8Array(new InitResponse(1, 0, 3, 0, 2, 0, 0, 0, 0).encode())));
      this.output(packet(this.wall ? TIME_SYNC_REQUEST : READY, this.wall ? this.syncId : id, this.wall ? [] : [0]));
    } else if (command === TIME_SYNC_RESPONSE) {
      this.syncs++;
      if (this.syncs < 3) this.output(packet(TIME_SYNC_REQUEST, ++this.syncId));
      else if (this.syncs === 3) this.output(packet(READY, this.initId, [1]));
    } else this.output(packet(command, id, command === 0x12 ? [0x34, 0x12] : []));
  }
}
/** Drain transport promise chains without any real I/O or hardware. */
async function flush() { for (let i = 0; i < 80; i++) await Promise.resolve(); }
const connected = [];
afterEach(async () => { for (const c of connected.splice(0)) await c.disconnect(); vi.unstubAllGlobals(); });

/** Install a Web Serial API that records reader/writer ownership and releases blocked reads. */
function serialFixture() {
  const queue = []; let waiting;
  const output = (data) => {
    if (waiting) { const resolve = waiting; waiting = null; resolve({ value: data, done: false }); }
    else queue.push(data);
  };
  const board = new Board(output);
  const reader = {
    read: vi.fn(() => queue.length ? Promise.resolve({ value: queue.shift(), done: false }) : new Promise((resolve) => { waiting = resolve; })),
    cancel: vi.fn(async () => { if (waiting) { waiting({ done: true }); waiting = null; } }),
    releaseLock: vi.fn(),
  };
  const writer = { write: vi.fn(async (data) => board.receive(data)), abort: vi.fn(async () => {}), releaseLock: vi.fn() };
  const port = { open: vi.fn(async () => {}), close: vi.fn(async () => {}), readable: { getReader: vi.fn(() => reader) }, writable: { getWriter: vi.fn(() => writer) } };
  vi.stubGlobal('navigator', { serial: { requestPort: vi.fn(async () => port), addEventListener: vi.fn(), removeEventListener: vi.fn() } });
  return { port, board, reader, writer };
}

/** Simulate the existing proxy protocol, including blocking READ and coalesced serial bytes. */
class ProxySocket {
  static OPEN = 1;
  static latest;
  constructor(url) {
    this.url = url; this.readyState = 0; this.queue = []; this.readSize = null; this.sent = [];
    this.board = new Board((data) => { this.queue.push(...data); this.flushRead(); });
    ProxySocket.latest = this;
    queueMicrotask(() => { this.readyState = 1; this.onopen?.(); });
  }
  send(data) {
    this.sent.push(data);
    if (typeof data === 'string') {
      const request = JSON.parse(data);
      queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({ op: request.op, ok: true }) }));
    } else if (data[0] === 1) this.board.receive(data.slice(1));
    else {
      expect(this.readSize).toBeNull();
      this.readSize = data[1] | data[2] << 8;
      this.flushRead();
    }
  }
  flushRead() {
    if (!this.readSize || !this.queue.length) return;
    const bytes = new Uint8Array(this.queue.splice(0, this.readSize));
    this.readSize = null;
    queueMicrotask(() => this.onmessage?.({ data: bytes.buffer }));
  }
  close() { this.readyState = 3; queueMicrotask(() => this.onclose?.()); }
}

describe('Web Serial v2 adapter', () => {
  it('holds one reader, waits for READY, serves periodic sync and releases stream locks', async () => {
    const { port, board, reader, writer } = serialFixture();
    const c = new KinisiClient(); connected.push(c);
    expect(await c.connect()).toBe(true); expect(c.ready).toBe(true);
    expect(board.syncs).toBe(3); expect(port.readable.getReader).toHaveBeenCalledTimes(1);
    expect(await c.get_encoder_value(0)).toBe(0x1234);
    board.output(packet(TIME_SYNC_REQUEST, 999)); await flush();
    expect(board.syncs).toBe(4);
    await c.disconnect();
    expect(reader.cancel).toHaveBeenCalled(); expect(writer.abort).toHaveBeenCalled();
    expect(reader.releaseLock).toHaveBeenCalled(); expect(writer.releaseLock).toHaveBeenCalled();
    expect(port.close).toHaveBeenCalled(); expect(c.ready).toBe(false);
  });

  it('closes a port after an incompatible INIT response', async () => {
    const { board, port } = serialFixture();
    board.receive = (data) => board.output(packet(INIT, data[2], new Uint8Array(new InitResponse(1, 0, 3, 0, 1, 0, 0, 0, 0).encode())));
    const c = new KinisiClient(); connected.push(c);
    expect(await c.connect()).toBe(false);
    expect(c.lastError).toContain('Incompatible'); expect(port.close).toHaveBeenCalled();
  });
});

describe('WebSocket proxy v2 adapter', () => {
  it('waits for serial INIT/READY after proxy open and serves idle sync through READ opcodes', async () => {
    vi.stubGlobal('WebSocket', ProxySocket);
    const c = new KinisiWebSocketClient('ws://robot.local:8765'); connected.push(c);
    expect(await c.connect()).toBe(true); expect(c.ready).toBe(false);
    expect((await c.open('/dev/ttyACM0')).ok).toBe(true);
    const socket = ProxySocket.latest;
    expect(socket.board.syncs).toBe(3); expect(c.ready).toBe(true);
    expect(await c.get_encoder_value(0)).toBe(0x1234);
    socket.board.output(packet(TIME_SYNC_REQUEST, 999)); await flush();
    expect(socket.board.syncs).toBe(4);
    await c.disconnect(); expect(socket.readyState).toBe(3); expect(c.ready).toBe(false);
    expect(c._pendingReads).toHaveLength(0); expect(c._pendingControls).toHaveLength(0);
  });

  it('preserves wss and supports a proxy uptime session', async () => {
    vi.stubGlobal('WebSocket', ProxySocket);
    const c = new KinisiWebSocketClient('wss://robot.local:8765', null, 8765, { wallClock: false }); connected.push(c);
    await c.connect(); expect(ProxySocket.latest.url).toBe('wss://robot.local:8765');
    expect((await c.open('/dev/ttyACM0')).ok).toBe(true);
    expect(c.clockMode).toBe(0); expect(ProxySocket.latest.board.syncs).toBe(0);
  });
});
