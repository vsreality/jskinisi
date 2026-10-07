import { describe, it, expect, vi } from 'vitest';
import { Commands } from './kinisi_commands';

describe('position command wire format', () => {
  it.each([
    ['initialize_motor_position_pid_controller', [3, 2, 1, 0.02, 0.3, 0.04, 0.5], 0x10, 49, [2, 1, 0.02, 0.3, 0.04, 0.5]],
    ['initialize_platform_position_pid_controller', [1, 2, 0.2, 0.5, 0.01, 0.03, 0.1, 0.02, 0.15, 0.2, 0.03, 0.4], 0x4e, 96,
      [1, 2, 0.2, 0.5, 0.01, 0.03, 0.1, 0.02, 0.15, 0.2, 0.03, 0.4]],
    ['initialize_motor_position_controller', [3, 2, 1, 0.02], 0x0c, 25, [2, 1, 0.02]],
    ['reset_motor_position', [3], 0x0d, 1, []],
    ['set_motor_position', [3, -4 * Math.PI], 0x0e, 9, [-4 * Math.PI]],
    ['initialize_platform_position_controller', [1, 2, 0.2, 0.5, 0.01, 0.03], 0x4b, 48, [1, 2, 0.2, 0.5, 0.01, 0.03]],
    ['reset_platform_position', [], 0x4c, 0, []],
    ['set_platform_position', [-1, 2, -Math.PI], 0x4d, 24, [-1, 2, -Math.PI]],
  ])('%s encodes exact packed fields and awaits ACK', async (method, args, id, size, values) => {
    const c = new Commands();
    let ack;
    c._request = vi.fn(() => new Promise(resolve => { ack = resolve; }));
    let done = false;
    const result = c[method](...args).then(() => { done = true; });
    expect(c._request).toHaveBeenCalledOnce();
    const [command, payload, responseSize] = c._request.mock.calls[0];
    expect(command).toBe(id); expect(payload.byteLength).toBe(size); expect(responseSize).toBe(0);
    const view = new DataView(payload), offset = method.includes('motor') ? 1 : 0;
    if (offset) expect(view.getUint8(0)).toBe(3);
    values.forEach((value, i) => expect(view.getFloat64(offset + i * 8, true)).toBe(value));
    await Promise.resolve(); expect(done).toBe(false);
    ack(new ArrayBuffer(0)); await result; expect(done).toBe(true);
  });

  it('reads a signed multi-turn motor angle from a byte view', async () => {
    const c = new Commands(), bytes = new Uint8Array(10);
    new DataView(bytes.buffer).setFloat64(1, -9 * Math.PI, true);
    c._request = vi.fn().mockResolvedValue(bytes.subarray(1, 9));
    expect(await c.get_motor_position(2)).toBe(-9 * Math.PI);
    expect(c._request.mock.calls[0][0]).toBe(0x0f);
    expect(c._request.mock.calls[0][2]).toBe(8);
    c._request.mockResolvedValue(new ArrayBuffer(7));
    await expect(c.get_motor_position(2)).rejects.toThrow('Expected 8');
  });

  it.each([
    ['initialize_motor_position_pid_controller', [0, 1, 1, 0, -1, 0, 1]],
    ['initialize_motor_position_pid_controller', [0, 1, 1, 0, 0, NaN, 1]],
    ['initialize_motor_position_pid_controller', [0, 1, 1, 0, 0, 0, -1]],
    ['initialize_platform_position_pid_controller', [1, 2, 0.2, 0.5, 0, 0, 0, 0, 0, 0, -1, 1]],
    ['set_motor_position', [4, 0]], ['set_motor_position', [-1, 0]],
    ['set_motor_position', [0.5, 0]], ['set_motor_position', [0, NaN]],
    ['set_motor_position', [0, '']], ['set_platform_position', [0, Infinity, 0]],
    ['initialize_motor_position_controller', [0, 0, 1, 0]],
    ['initialize_motor_position_controller', [0, 1, -1, 0]],
    ['initialize_motor_position_controller', [0, 1, 1, -0.1]],
    ['initialize_platform_position_controller', [1, 2, 0.2, 0, 0, 0]],
  ])('rejects invalid %s input before sending', async (method, args) => {
    const c = new Commands(); c._request = vi.fn();
    await expect(c[method](...args)).rejects.toThrow();
    expect(c._request).not.toHaveBeenCalled();
  });
});
