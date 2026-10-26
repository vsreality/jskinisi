import { describe, it, expect, vi } from 'vitest';
import { Commands, Topic, MotorCurrentSample, decodeTelemetryEvent } from './kinisi_commands';
import { supportsMotorCurrent } from './board_profile';
import { supportsTopic } from './telemetry';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 7 };
describe('Motor current', () => {
  it('encodes each motor index and reads amperes from an offset byte view', async () => {
    const c = new Commands();
    const data = new Uint8Array(12);
    new DataView(data.buffer).setFloat64(3, 1.25, true);
    c._request = vi.fn().mockResolvedValue(data.subarray(3, 11));
    for (let index = 0; index < 4; index++) {
      expect(await c.get_motor_current(index)).toBe(1.25);
      const [command, payload, size] = c._request.mock.calls[index];
      expect(command).toBe(0x52); expect(size).toBe(8);
      expect([...new Uint8Array(payload)]).toEqual([index]);
    }
  });
  it('rejects invalid motor indices before writing', async () => {
    const c = new Commands(); c._request = vi.fn();
    for (const index of [-1, 4, 255, 0.5, '0', true, undefined, NaN])
      await expect(c.get_motor_current(index)).rejects.toThrow('motor_index');
    expect(c._request).not.toHaveBeenCalled();
  });
  it('validates pull and streamed measurements, retaining precise timestamps', async () => {
    const c = new Commands();
    for (const amps of [-1, NaN, Infinity, -Infinity]) {
      const data = new ArrayBuffer(8); new DataView(data).setFloat64(0, amps, true);
      c._request = vi.fn().mockResolvedValue(data);
      await expect(c.get_motor_current(0)).rejects.toThrow('Invalid motor current');
      const sample = new MotorCurrentSample(2n ** 55n + 7n, 0, 1, amps);
      expect(() => decodeTelemetryEvent(new Uint8Array([5, 3, ...new Uint8Array(sample.encode())]))).toThrow();
    }
    const sample = new MotorCurrentSample(2n ** 55n + 7n, 0, 1, 0);
    const decoded = decodeTelemetryEvent(new Uint8Array([5, 3, ...new Uint8Array(sample.encode())]));
    expect(decoded).toEqual({ topic: Topic.MOTOR_CURRENT, index: 3, sample });
    for (const length of [0, 7, 9]) {
      c._request = vi.fn().mockResolvedValue(new ArrayBuffer(length));
      await expect(c.get_motor_current(0)).rejects.toThrow('payload bytes');
    }
  });
  it('requires fitted hardware and protocol 2.7 for every motor', () => {
    for (let index = 0; index < 4; ++index) {
      expect(supportsMotorCurrent(info, index)).toBe(true);
      expect(supportsTopic(info, Topic.MOTOR_CURRENT, index)).toBe(true);
    }
    for (const absent of [null, {}, { ...info, protocol_minor: 6 }, { ...info, protocol_major: 3 },
      ...[1, 2, 3, 99].map(board_minor => ({ ...info, board_minor }))]) {
      expect(supportsMotorCurrent(absent)).toBe(false);
      expect(supportsTopic(absent, Topic.MOTOR_CURRENT)).toBe(false);
    }
    expect(supportsMotorCurrent(info, 4)).toBe(false);
  });
});
