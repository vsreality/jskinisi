// ----------------------------------------------------------------------------
// Filename: kinisi_ws_client.js
// Description: KinisiWebSocketClient is a drop-in alternative to KinisiClient
// that tunnels raw serial traffic to a Python proxy (see kinisi-serial-proxy)
// over a WebSocket instead of talking to navigator.serial directly.
//
// It implements the same write(buffer) / read(numBytes) interface expected by
// the Commands base class, so all command methods work unchanged. The proxy
// forwards the bytes to the physical serial port on the Raspberry Pi.
//
// Wire protocol (must match kinisi-serial-proxy/proxy.py):
//   * Text  frames -> JSON control messages (open / close / list / status).
//   * Binary frames -> raw serial data with a 1-byte opcode prefix:
//       WRITE (0x01): [0x01, ...payload]        (no response)
//       READ  (0x02): [0x02, len_lo, len_hi]    (proxy replies with the bytes)
// ----------------------------------------------------------------------------

import { Commands } from './kinisi_commands';

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
  return {
    ws: `ws://${authority}`,
    http: `http://${authority}`,
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

class KinisiWebSocketClient extends Commands {
  // Fetch the list of serial ports available on the proxy host over HTTP.
  // Returns an array of { device, description, hwid }.
  static async listPorts(host, defaultPort = 8765) {
    const { http } = proxyUrls(host, defaultPort);
    let response;
    try {
      response = await fetch(`${http}/ports`);
    } catch (error) {
      throw new Error(`${describe(error)}.${insecureLocalHint()}`, {
        cause: error,
      });
    }
    if (!response.ok) {
      throw new Error(`Proxy responded ${response.status} to /ports`);
    }
    const data = await response.json();
    return data.ports || [];
  }

  // Parameters:
  //   host:         Proxy host as entered by the user, e.g. "raspberrypi.local",
  //                 "127.0.0.1:8765", or a full "ws://host:9000" URL.
  //   onDisconnect: optional callback invoked when the socket closes.
  //   defaultPort:  port to assume when host has none (default 8765).
  constructor(host, onDisconnect, defaultPort = 8765) {
    super();
    this.host = host;
    this.url = proxyUrls(host, defaultPort).ws;
    this.onDisconnect = onDisconnect;
    this.socket = null;
    this.baudRate = 115200;
    this.serialPort = null; // remote serial device, chosen via open()
    // Reason the last connect() attempt failed, for the UI to display.
    this.lastError = null;

    // Read requests are answered by the next binary frame from the proxy.
    // Because Commands always awaits a write before its matching read, and the
    // WebSocket preserves order, a simple FIFO of pending read resolvers is
    // enough to pair responses with requests.
    this._pendingReads = [];
    // Pending JSON control requests, keyed by op.
    this._pendingControls = [];
  }

  // Open the WebSocket connection to the proxy.
  async connect() {
    try {
      await this._openSocket();
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = error.message;
      console.log(`Error connecting to proxy: ${error}`);
      return false;
    }
  }

  _openSocket() {
    return new Promise((resolve, reject) => {
      let socket;
      try {
        // Firefox and Safari throw SecurityError synchronously here when an
        // HTTPS page opens a plain ws:// socket.
        socket = new WebSocket(this.url);
      } catch (error) {
        reject(
          new Error(
            `Could not open ${this.url}: ${describe(error)}.${insecureLocalHint()}`,
            { cause: error }
          )
        );
        return;
      }
      socket.binaryType = 'arraybuffer';

      socket.onopen = () => {
        console.log(`Connected to proxy at ${this.url}`);
        resolve();
      };

      socket.onerror = () => {
        reject(
          new Error(
            `WebSocket error connecting to ${this.url}.${insecureLocalHint()}`
          )
        );
      };

      socket.onclose = (event) => {
        console.log('Proxy connection closed.');
        // Fail any in-flight reads so awaiters don't hang forever.
        this._pendingReads.forEach(({ reject: rej }) =>
          rej(new Error('Proxy connection closed')));
        this._pendingReads = [];
        this._pendingControls.forEach(({ reject: rej }) =>
          rej(new Error('Proxy connection closed')));
        this._pendingControls = [];
        this.socket = null;
        if (this.onDisconnect) {
          this.onDisconnect(event);
        }
      };

      socket.onmessage = (event) => this._onMessage(event);

      this.socket = socket;
    });
  }

  _onMessage(event) {
    if (event.data instanceof ArrayBuffer) {
      // Binary frame -> answer the oldest pending read request.
      const pending = this._pendingReads.shift();
      if (pending) {
        pending.resolve(event.data);
      } else {
        console.log('Received unexpected serial data with no pending read.');
      }
    } else {
      // Text frame -> JSON control reply.
      let reply;
      try {
        reply = JSON.parse(event.data);
      } catch {
        console.log(`Invalid control reply: ${event.data}`);
        return;
      }
      const pending = this._pendingControls.shift();
      if (pending) {
        pending.resolve(reply);
      }
    }
  }

  // Send a JSON control message and await its reply.
  _control(request) {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Proxy not connected'));
        return;
      }
      this._pendingControls.push({ resolve, reject });
      this.socket.send(JSON.stringify(request));
    });
  }

  // List serial ports available on the proxy host.
  async listPorts() {
    const reply = await this._control({ op: 'list' });
    return reply.ports || [];
  }

  // Open a serial port on the proxy host. Returns the proxy's reply,
  // e.g. { ok: true, port, baudRate } or { ok: false, error }.
  async open(serialPort, baudRate = this.baudRate) {
    const reply = await this._control({ op: 'open', port: serialPort, baudRate });
    if (reply.ok) {
      this.serialPort = serialPort;
      this.baudRate = baudRate;
    }
    return reply;
  }

  // Query current proxy/serial status.
  async status() {
    return this._control({ op: 'status' });
  }

  // Write data to the serial port via the proxy (Commands interface).
  async write(buffer) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Proxy not connected');
    }
    const payload = new Uint8Array(buffer);
    const frame = new Uint8Array(payload.length + 1);
    frame[0] = OP_WRITE;
    frame.set(payload, 1);
    this.socket.send(frame);
  }

  // Read numBytes from the serial port via the proxy (Commands interface).
  // Returns an ArrayBuffer, matching KinisiClient.read().
  async read(numBytes) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Proxy not connected');
    }
    const frame = new Uint8Array(3);
    frame[0] = OP_READ;
    frame[1] = numBytes & 0xff; // len_lo
    frame[2] = (numBytes >> 8) & 0xff; // len_hi

    const promise = new Promise((resolve, reject) => {
      this._pendingReads.push({ resolve, reject });
    });
    this.socket.send(frame);
    return promise;
  }

  async disconnect() {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        await this._control({ op: 'close' });
      }
    } catch {
      // Ignore; we're tearing down anyway.
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    console.log('Disconnected from proxy.');
  }
}

export { KinisiWebSocketClient, MotorIndex, EncoderIndex };
