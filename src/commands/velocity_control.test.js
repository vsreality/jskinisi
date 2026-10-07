import { describe, expect, it, vi } from 'vitest';
import { Commands } from './kinisi_commands';

describe('velocity PID input validation', () => {
  const requests = [
    ['initialize_motor_controller', [0, false, 0, false, 100], 5],
    ['start_platform_controller', [], 0],
  ];
  it.each(requests)('%s accepts limits in PWM units, including zero', async (method, prefix) => {
    const c = new Commands(); c._request = vi.fn().mockResolvedValue(new ArrayBuffer(0));
    await c[method](...prefix, '1', '0.2', '0', '100');
    await c[method](...prefix, 1, 1, 0, 0);
    expect(c._request).toHaveBeenCalledTimes(2);
    const payload = c._request.mock.calls[0][1];
    expect(new DataView(payload).getFloat64(payload.byteLength - 8, true)).toBe(100);
  });
  it.each(requests)('%s rejects invalid gains or limits before transmission', async (method, prefix) => {
    const c = new Commands(); c._request = vi.fn();
    for (const gains of [[-1,0,0,30], [1,NaN,0,30], [1,0,Infinity,30],
      [1,0,0,-1], [1,0,0,101], [1,0,0,''], [1,0,0,null], [true,0,0,30]]) {
      await expect(c[method](...prefix, ...gains)).rejects.toThrow();
    }
    expect(c._request).not.toHaveBeenCalled();
  });
});
