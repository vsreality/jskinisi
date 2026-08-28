// ----------------------------------------------------------------------------
// Filename: kinisi_client.js
// Description: KinisiClient class is an implementation serial communication with the Kinisi controller.
// It is implements the commands defined in kinisi_commands.js.
// ----------------------------------------------------------------------------

import { Commands } from './kinisi_commands';

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

class KinisiClient extends Commands {
    // Constructor
    constructor(onDisconnect) {
      super();
      this.port = null;
      this.reader = null;
      this.writer = null;
      this.baudRate = 115200;
      this.onDisconnect = onDisconnect;
      // Reason the last connect() attempt failed, for the UI to display.
      this.lastError = null;
      // Guard: navigator.serial is undefined on insecure origins, and this
      // constructor runs at app start-up, so an unguarded access here blanks
      // the whole page rather than just disabling the local-serial option.
      if (typeof navigator !== 'undefined' && 'serial' in navigator) {
        navigator.serial.addEventListener("disconnect", (event) => {
          console.log("Disconnected from serial port.");
          if (this.onDisconnect) {
            this.onDisconnect(event);
          }
        });
      }
    }

    async connect() {
        this.lastError = null;
        try {
            const unavailable = webSerialUnavailableReason();
            if (unavailable) {
              throw new Error(unavailable);
            }
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: this.baudRate });
            console.log("Connected.");
            return true;
          }
          catch (error) {
            console.log(`Error connecting to serial port: ${error}`);
            this.lastError = error.message;
            return false;
          }
    }
  
    // Write data to the serial port
    async write(buffer) {
        var writer = this.port.writable.getWriter();
        await writer.write(buffer);
        await writer.releaseLock();
    }

    // Read data from the serial port
    async read(numBytes) {
        let reader = this.port.readable.getReader({ mode: "byob" });
        let buffer = new ArrayBuffer(numBytes);
        let offset = 0;
        while (offset < buffer.byteLength) {
            const { value, done } = await reader.read(new Uint8Array(buffer, offset));
            if (done) {
                break;
            }
            buffer = value.buffer;
            offset += value.byteLength;
        }
        await reader.releaseLock();
        return buffer;
    }

    async disconnect() {
        if (this.port) {
          await this.port.close();
          this.port = null;
          this.reader = null;
        }
        console.log("Disconnected.");
      }
  }

export { KinisiClient, MotorIndex, EncoderIndex };