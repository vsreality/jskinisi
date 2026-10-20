import { describe, it, expect, vi } from 'vitest';
import { Commands, GET_IMU } from './kinisi_commands';
import { supportsImuRead } from './imu';

const values = [0, -1.25, 9.80665, 0.125, -0.25, 0.5];
const fields = ['acceleration_x', 'acceleration_y', 'acceleration_z',
  'angular_velocity_x', 'angular_velocity_y', 'angular_velocity_z'];

describe('IMU command', () => {
  it('decodes all six signed SI measurements from an offset byte view', async () => {
    const client = new Commands();
    const bytes = new Uint8Array(53);
    values.forEach((value, i) => new DataView(bytes.buffer).setFloat64(3 + i * 8, value, true));
    client._request = vi.fn().mockResolvedValue(bytes.subarray(3, 51));
    expect(await client.get_imu(0)).toEqual(Object.fromEntries(fields.map((field, i) => [field, values[i]])));
    const [command, payload, size] = client._request.mock.calls[0];
    expect(command).toBe(0x51); expect(GET_IMU).toBe(0x51);
    expect([...new Uint8Array(payload)]).toEqual([0]); expect(size).toBe(48);
    await client.get_imu(255);
    expect([...new Uint8Array(client._request.mock.calls[1][1])]).toEqual([255]);
  });
  it.each([-1, 256, 0.5, '0', null, undefined, true, NaN, Infinity])('rejects invalid index %s before I/O', async index => {
    const client = new Commands(); client._request = vi.fn();
    await expect(client.get_imu(index)).rejects.toThrow('sensor_index');
    expect(client._request).not.toHaveBeenCalled();
  });
  it.each([0, 47, 49])('rejects a %s-byte payload', async length => {
    const client = new Commands(); client._request = vi.fn().mockResolvedValue(new ArrayBuffer(length));
    await expect(client.get_imu(0)).rejects.toThrow('Expected 48 payload bytes');
  });
  it.each(fields)('rejects a non-finite %s', async field => {
    const client = new Commands(); const bytes = new ArrayBuffer(48);
    for (const value of [NaN, Infinity, -Infinity]) {
      new DataView(bytes).setFloat64(fields.indexOf(field) * 8, value, true);
      client._request = vi.fn().mockResolvedValue(bytes);
      await expect(client.get_imu(0)).rejects.toThrow('Invalid IMU payload');
    }
  });
  it('gates on protocol support independently of board revision', () => {
    for (const info of [null, {}, { protocol_major: 2, protocol_minor: 4 }, { protocol_major: 3, protocol_minor: 5 }])
      expect(supportsImuRead(info)).toBe(false);
    expect(supportsImuRead({ protocol_major: 2, protocol_minor: 5 })).toBe(true);
    expect(supportsImuRead({ protocol_major: 2, protocol_minor: 6 })).toBe(true);
  });
});
