// ----------------------------------------------------------------------------
// Filename: kinisi_ws_client.js
// Description: KinisiWebSocketClient is a drop-in alternative to KinisiClient
// that tunnels raw serial traffic to a Python proxy (see kinisi-serial-proxy)
// over a WebSocket instead of talking to navigator.serial directly.
//
// It feeds a shared API-v2 session from one continuous READ loop. The proxy
// forwards the bytes to the physical serial port on the Raspberry Pi.
//
// Wire protocol (must match kinisi-serial-proxy/proxy.py):
//   * Text  frames -> JSON control messages (open / close / list / status).
//   * Binary frames -> raw serial data with a 1-byte opcode prefix:
//       WRITE (0x01): [0x01, ...payload]        (no response)
//       READ  (0x02): [0x02, len_lo, len_hi]    (proxy replies with the bytes)
// ----------------------------------------------------------------------------

import { KinisiSession, ConnectionClosedError } from './kinisi_session.js';

const OP_WRITE = 0x01;
const OP_READ = 0x02;

const MotorIndex = {
  Motor0: 0,
  Motor1: 1,
  Motor2: 2,
  Motor3: 3,
};

const EncoderIndex = {
  Encoder0: 0,
  Encoder1: 1,
  Encoder2: 2,
  Encoder3: 3,
};

// Turn a user-entered host (e.g. "raspberrypi.local", "127.0.0.1:8765",
// or "ws://host:9000") into the ws:// and http:// base URLs of the proxy.
// Serial ports are listed over HTTP; serial data flows over the WebSocket.
function proxyUrls(host, defaultPort = 8765) {
  let value = host.trim();
  // Strip any scheme the user may have typed.
  value = value.replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '');
  value = value.replace(/\/+$/, '');
  const hasPort = /:\d+$/.test(value);
  const authority = hasPort ? value : `${value}:${defaultPort}`;
  const secure = /^wss:\/\//i.test(host.trim()) || /^https:\/\//i.test(host.trim());
  return {
    ws: `${secure ? 'wss' : 'ws'}://${authority}`,
    http: `${secure ? 'https' : 'http'}://${authority}`,
  };
}

// Plain ws:// and http:// requests from an HTTPS page are treated as mixed
// content. Chrome and Edge still permit them for private-network targets (with
// a deprecation warning), but Firefox and Safari block them outright, which
// surfaces as an opaque SecurityError or a bare "Failed to fetch". Explain both
// possibilities rather than leaving the user at a dead end.
function insecureLocalHint() {
  if (typeof window === 'undefined') return '';
  if (window.location.protocol !== 'https:') return '';
  return (
    ' Check that the proxy is running and reachable. Note that this page is' +
    ' served over HTTPS: Firefox and Safari block insecure connections to a' +
    ' proxy on your local network, while Chrome and Edge allow them.'
  );
}

// Drop a trailing period so the hint reads as one sentence.
function describe(error) {
  return String(error && error.message ? error.message : error).replace(/\.\s*$/, '');
}

class KinisiWebSocketClient extends KinisiSession {
  /** Discover serial ports without opening the controller connection. */
  static async listPorts(host, defaultPort = 8765) {
    const { http } = proxyUrls(host, defaultPort);
    let response;
    try { response = await fetch(`${http}/ports`); }
    catch (error) { throw new Error(`${describe(error)}.${insecureLocalHint()}`, { cause: error }); }
    if (!response.ok) throw new Error(`Proxy responded ${response.status} to /ports`);
    return (await response.json()).ports || [];
  }

  /** Options configure the shared session; existing host/callback/port arguments are retained. */
  constructor(host, onDisconnect, defaultPort = 8765, options = {}) {
    super(options);
    this.host = host; this.url = proxyUrls(host, defaultPort).ws;
    this.onDisconnect = onDisconnect; this.socket = null;
    this.baudRate = 115200; this.serialPort = null;
    this._pendingReads = []; this._pendingControls = []; this._closing = null;
  }

  /** Connect to the proxy. open() performs the board handshake after a port is selected. */
  async connect() {
    if (this.socket) { this.lastError = 'Proxy already connected'; return false; }
    try { await this._openSocket(); this.lastError = null; return true; }
    catch (error) { this.lastError = error.message; await this.disconnect(); return false; }
  }

  /** Install handlers once and bound opening an unreachable WebSocket. */
  _openSocket() {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url); this.socket = socket;
      socket.binaryType = 'arraybuffer';
      const timer = setTimeout(() => {
        reject(new Error('Proxy connection timed out')); socket.close();
      }, this.initTimeoutMs);
      socket.onopen = () => { clearTimeout(timer); resolve(); };
      socket.onerror = () => {
        clearTimeout(timer);
        const error = new Error(`WebSocket error connecting to ${this.url}.${insecureLocalHint()}`);
        reject(error);
        if (this._session) this._fatal(error);
      };
      socket.onclose = () => {
        clearTimeout(timer);
        const error = new ConnectionClosedError('Proxy connection closed');
        reject(error);
        if (this.socket !== socket) return;
        this.socket = null;
        this._rejectTransport(error);
        if (this._session) this._fatal(error);
      };
      socket.onmessage = (event) => { if (this.socket === socket) this._onMessage(event); };
    });
  }

  /** Pair proxy READ replies separately from JSON controls; protocol IDs are handled above. */
  _onMessage(event) {
    if (event.data instanceof ArrayBuffer) {
      const pending = this._pendingReads.shift();
      if (pending) { clearTimeout(pending.timer); pending.resolve(event.data); }
      return;
    }
    let reply;
    try { reply = JSON.parse(event.data); }
    catch { this._fatal(new Error('Invalid proxy JSON response')); return; }
    if (['read', 'write'].includes(reply.op) && !reply.ok) {
      this._fatal(new Error(reply.error || 'Proxy serial operation failed')); return;
    }
    const pending = this._pendingControls.shift();
    if (pending) {
      clearTimeout(pending.timer);
      if (reply.op !== pending.op) pending.reject(new Error('Mismatched proxy control reply'));
      else pending.resolve(reply);
    }
  }

  /** Fail all proxy waiters when the socket closes; no timers survive teardown. */
  _rejectTransport(error) {
    for (const pending of [...this._pendingReads, ...this._pendingControls]) {
      clearTimeout(pending.timer); pending.reject(error);
    }
    this._pendingReads = []; this._pendingControls = [];
  }

  /** Send an ordered JSON control request, closing on timeout to discard late replies. */
  _control(request) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return Promise.reject(new ConnectionClosedError('Proxy not connected'));
    return new Promise((resolve, reject) => {
      const pending = { resolve, reject, op: request.op };
      pending.timer = setTimeout(() => {
        const error = new Error(`Proxy ${request.op} timed out`);
        this._rejectTransport(error); this.socket?.close();
      }, this.initTimeoutMs);
      this._pendingControls.push(pending);
      try { this.socket.send(JSON.stringify(request)); }
      catch (error) { this._rejectTransport(error); this.socket?.close(); }
    });
  }

  /** List ports over an already-open proxy socket. */
  async listPorts() { return (await this._control({ op: 'list' })).ports || []; }

  /** Open the remote serial port and require the board's INIT/READY before returning ok. */
  async open(serialPort, baudRate = this.baudRate) {
    try {
      const reply = await this._control({ op: 'open', port: serialPort, baudRate });
      if (!reply.ok) return reply;
      this.serialPort = serialPort; this.baudRate = baudRate;
      await this._startSession();
      return reply;
    } catch (error) {
      this.lastError = error.message;
      await this.disconnect();
      return { op: 'open', ok: false, error: error.message };
    }
  }

  /** Query the proxy's serial-port status. */
  async status() { return this._control({ op: 'status' }); }

  /** Prefix an entire v2 frame with the existing proxy WRITE opcode. */
  async _writeBytes(buffer) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) throw new ConnectionClosedError('Proxy not connected');
    const message = new Uint8Array(buffer.byteLength + 1);
    message[0] = OP_WRITE; message.set(new Uint8Array(buffer), 1);
    this.socket.send(message);
  }

  /** Read only the missing frame bytes; one outstanding READ avoids proxy FIFO ambiguity. */
  _readBytes(needed) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return Promise.reject(new ConnectionClosedError('Proxy not connected'));
    return new Promise((resolve, reject) => {
      const pending = { resolve, reject };
      pending.timer = setTimeout(() => {
        const error = new Error('Proxy read timed out');
        this._rejectTransport(error); this.socket?.close();
      }, this.requestTimeoutMs);
      this._pendingReads.push(pending);
      try { this.socket.send(new Uint8Array([OP_READ, needed & 255, needed >> 8])); }
      catch (error) { this._rejectTransport(error); this.socket?.close(); }
    });
  }

  /** Stop session work, request port closure, then close the socket even on proxy errors. */
  disconnect() {
    if (this._closing) return this._closing;
    this._endSession();
    this._closing = this._closeSocket().finally(() => { this._closing = null; });
    return this._closing;
  }

  /** Release pending transport requests and close exactly the socket owned by this client. */
  async _closeSocket() {
    const socket = this.socket;
    try { if (socket?.readyState === WebSocket.OPEN) await this._control({ op: 'close' }); }
    catch { /* The socket still must close when the proxy cannot acknowledge teardown. */ }
    this._rejectTransport(new ConnectionClosedError());
    if (this.socket === socket) this.socket = null;
    this.serialPort = null; socket?.close();
    if (this._readerTask) await this._readerTask;
  }
}

export { KinisiWebSocketClient, MotorIndex, EncoderIndex };
