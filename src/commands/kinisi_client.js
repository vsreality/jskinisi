// ----------------------------------------------------------------------------
// Filename: kinisi_client.js
// Description: KinisiClient class is an implementation serial communication with the Kinisi controller.
// A persistent reader dispatches v2 responses and controller-initiated clock requests.
// ----------------------------------------------------------------------------

import { KinisiSession, ConnectionClosedError } from './kinisi_session.js';

const MotorIndex = {
  Motor0: 0,
  Motor1: 1,
  Motor2: 2,
  Motor3: 3,
}

const EncoderIndex = {
  Encoder0: 0,
  Encoder1: 1,
  Encoder2: 2,
  Encoder3: 3,
}

// Web Serial is gated on a secure context, which means HTTPS *or* a loopback
// address -- http://localhost is trusted and needs no certificate. What is
// excluded is a plain-HTTP page on a routable address, e.g. served straight off
// the Raspberry Pi, where navigator.serial is undefined in every browser.
// Explain which of the two reasons applies instead of just saying "not supported".
export function webSerialUnavailableReason() {
  if (typeof navigator !== 'undefined' && 'serial' in navigator) return null;
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return (
      'Web Serial needs a secure page. This one is served over plain HTTP from' +
      ` ${window.location.hostname}, so the browser hides it. Use the remote` +
      ' proxy option instead, or open the app over HTTPS or from localhost.'
    );
  }
  return 'Web Serial is not supported in this browser. Try Chrome or Edge, or use the remote proxy option.';
}

class KinisiClient extends KinisiSession {
  /** Configure a direct Web Serial client; options are shared with KinisiSession. */
  constructor(onDisconnect, options = {}) {
    super(options);
    this.port = null; this.reader = null; this.writer = null;
    this.baudRate = 115200; this.onDisconnect = onDisconnect;
    this._closing = null;
    this._deviceDisconnected = (event) => {
      if (event.target === this.port || event.port === this.port) this._fatal(new ConnectionClosedError('USB device disconnected'));
    };
  }

  /** Select/open the port, take its stream locks, and wait for INIT plus READY. */
  async connect() {
    if (this.port) { this.lastError = 'Already connected'; return false; }
    this.lastError = null;
    try {
      const unavailable = webSerialUnavailableReason();
      if (unavailable) throw new Error(unavailable);
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: this.baudRate });
      this.writer = this.port.writable.getWriter();
      this.reader = this.port.readable.getReader();
      navigator.serial.addEventListener('disconnect', this._deviceDisconnected);
      await this._startSession();
      return true;
    } catch (error) {
      this.lastError = error.message;
      await this.disconnect();
      return false;
    }
  }

  /** Write one complete frame under the session's serialization queue. */
  async _writeBytes(buffer) {
    if (!this.writer) throw new ConnectionClosedError();
    await this.writer.write(buffer);
  }

  /** Keep one persistent reader; arbitrary serial fragmentation is handled by the session. */
  async _readBytes(_needed) {
    if (!this.reader) throw new ConnectionClosedError();
    const { value, done } = await this.reader.read();
    if (done) throw new ConnectionClosedError('Serial stream closed');
    return value || new Uint8Array();
  }

  /** Cancel blocked I/O before releasing locks and closing the serial port. */
  disconnect() {
    if (this._closing) return this._closing;
    this._endSession();
    this._closing = this._closePort().finally(() => { this._closing = null; });
    return this._closing;
  }

  /** Clean up the exact reader/writer pair owned by this connection. */
  async _closePort() {
    if (typeof navigator !== 'undefined') navigator.serial?.removeEventListener('disconnect', this._deviceDisconnected);
    const reader = this.reader, writer = this.writer, port = this.port;
    this.reader = null; this.writer = null; this.port = null;
    await Promise.allSettled([reader?.cancel(), writer?.abort()]);
    if (this._readerTask) await this._readerTask;
    try { reader?.releaseLock(); } catch { /* A failed stream may already release its lock. */ }
    try { writer?.releaseLock(); } catch { /* A failed stream may already release its lock. */ }
    if (port) await port.close().catch(() => {});
  }
}

export { KinisiClient, MotorIndex, EncoderIndex };
