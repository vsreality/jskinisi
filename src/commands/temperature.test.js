import { describe, it, expect, vi } from 'vitest';
import { Commands, GET_TEMPERATURE, ErrorCode } from './kinisi_commands';
import { supportsTemperatureRead } from './temperature';

describe('temperature command', () => {
  it.each([25.0625, -40, -0.0625, 0, 125])('decodes %s °C from an offset byte view', async value => {
    const client = new Commands();
    const bytes = new Uint8Array(12);
    new DataView(bytes.buffer).setFloat64(3, value, true);
    client._request = vi.fn().mockResolvedValue(bytes.subarray(3, 11));
    expect(await client.get_temperature(0)).toBe(value);
    const [command, payload, size] = client._request.mock.calls[0];
    expect(command).toBe(0x50);
    expect([...new Uint8Array(payload)]).toEqual([0]);
    expect(size).toBe(8);
    expect(GET_TEMPERATURE).toBe(0x50);
    expect(ErrorCode.SENSOR_NOT_AVAILABLE).toBe(16);
  });

  it.each([-1, 256, 0.5, '0', true, null, undefined, NaN, Infinity])('rejects invalid sensor index %s before I/O', async index => {
    const client = new Commands();
    client._request = vi.fn();
    await expect(client.get_temperature(index)).rejects.toThrow('sensor_index');
    expect(client._request).not.toHaveBeenCalled();
  });

  it('preserves the highest byte index for firmware availability checks', async () => {
    const client = new Commands();
    client._request = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    await expect(client.get_temperature(255)).resolves.toBe(0);
    expect([...new Uint8Array(client._request.mock.calls[0][1])]).toEqual([255]);
  });

  it.each([0, 7, 9])('rejects a %s-byte response', async length => {
    const client = new Commands();
    client._request = vi.fn().mockResolvedValue(new ArrayBuffer(length));
    await expect(client.get_temperature(0)).rejects.toThrow('Expected 8 payload bytes');
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite temperature %s', async value => {
    const client = new Commands();
    const payload = new ArrayBuffer(8);
    new DataView(payload).setFloat64(0, value, true);
    client._request = vi.fn().mockResolvedValue(payload);
    await expect(client.get_temperature(0)).rejects.toThrow('Invalid temperature payload');
  });

  it('checks protocol support independently of hardware revision', () => {
    for (const info of [null, {}, { protocol_major: 2, protocol_minor: 3 }, { protocol_major: 3, protocol_minor: 4 }])
      expect(supportsTemperatureRead(info)).toBe(false);
    expect(supportsTemperatureRead({ protocol_major: 2, protocol_minor: 4 })).toBe(true);
    expect(supportsTemperatureRead({ protocol_major: 2, protocol_minor: 5 })).toBe(true);
  });
});
