import { expect, it, vi } from 'vitest';
import { KinisiSession } from './kinisi_session';
import { SAVE_CONFIGURATION, GET_CONFIGURATION_FIELD } from './kinisi_commands';
import { supportsConfigurationPersistence } from './board_profile';
import { ConfigurationField as Field, readRunningConfiguration } from './configuration';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 14 };

it('requires READY, exact known v0.4 hardware and protocol 2.14 for persistence before I/O', async () => {
  const c = new KinisiSession(); c.boardInfo = info; c._sendRequest = vi.fn();
  expect(c.supportsConfigurationPersistence()).toBe(false);
  await expect(c.save_configuration()).rejects.toThrow('not ready');
  c.ready = true;
  for (const board of [null, { ...info, protocol_minor: 13 }, { ...info, protocol_major: 3 },
    { ...info, board_minor: 3 }, { ...info, board_patch: 1 }, { ...info, board_model: 2 }]) {
    c.boardInfo = board;
    expect(supportsConfigurationPersistence(board)).toBe(false);
    expect(c.supportsConfigurationPersistence()).toBe(false);
    await expect(c.save_configuration()).rejects.toThrow('known v0.4');
    await expect(c.get_configuration_field(Field.PLATFORM_TYPE, 0)).rejects.toThrow('known v0.4');
  }
  expect(c._sendRequest).not.toHaveBeenCalled();
  c.boardInfo = info;
  expect(c.supportsConfigurationPersistence()).toBe(true);
  c._sendRequest.mockResolvedValue(new ArrayBuffer(0));
  await expect(c.save_configuration()).resolves.toBeUndefined();
  expect(c._sendRequest).toHaveBeenLastCalledWith(SAVE_CONFIGURATION, new ArrayBuffer(0), 0, false);
  const value = new ArrayBuffer(8); new DataView(value).setFloat64(0, 1425.1, true);
  c._sendRequest.mockResolvedValue(value);
  expect(await c.get_configuration_field(Field.ENCODER_RESOLUTION, 2)).toBe(1425.1);
  expect(c._sendRequest).toHaveBeenLastCalledWith(GET_CONFIGURATION_FIELD, new Uint8Array([4, 2]).buffer, 8, false);
  c._sendRequest.mockRejectedValue(new Error('Storage verification failed'));
  await expect(c.save_configuration()).rejects.toThrow('Storage verification failed');
});

it.each([[1, 'differential', 2], [2, 'omni', 3], [3, 'mecanum', 4]])(
  'reads applied %s geometry and each active encoder without reinitializing', async (type, platform, count) => {
    const c = { get_configuration_field: vi.fn(async (field, index) =>
      [type, 0.1, 0.3, 0.2, 1400 + index, index % 2, (index + 1) % 2][field]),
      get_pwm_frequency: vi.fn().mockResolvedValue(25000) };
    const setup = await readRunningConfiguration(c);
    expect(setup).toMatchObject({ platform, wheelDiameter: 0.1, pwmHz: 25000 });
    expect(setup.channelCount).toBe(count);
    expect(setup.encoders).toHaveLength(4);
    expect(setup.encoders[1]).toEqual({ resolution: 1401, reversed: true });
    expect(setup.motorReversed[0]).toBe(true);
    expect(c.get_configuration_field).not.toHaveBeenCalledWith(platform === 'omni' ? 2 : platform === 'differential' ? 3 : -1, 0);
  });

it('handles unconfigured boards and rejects malformed readback instead of enabling controls', async () => {
  const c = { get_configuration_field: vi.fn().mockResolvedValue(0), get_pwm_frequency: vi.fn() };
  expect(await readRunningConfiguration(c)).toBeNull();
  expect(c.get_configuration_field).toHaveBeenCalledTimes(1);
  expect(c.get_pwm_frequency).not.toHaveBeenCalled();
  c.get_configuration_field.mockResolvedValue(99);
  await expect(readRunningConfiguration(c)).rejects.toThrow('unknown platform');
  c.get_configuration_field.mockImplementation(async field => [1, 0.1, 0.3, 0, NaN, 0, 0][field]);
  await expect(readRunningConfiguration(c)).rejects.toThrow('invalid encoder');
});

it('preserves encoder-free and mixed channel setup in readback', async () => {
  const c = { get_configuration_field: vi.fn(async (field, index) =>
    [1, 0.1, 0.3, 0, index === 3 ? 2048 : 0, index === 3 ? 1 : 0, 0][field]),
    get_pwm_frequency: vi.fn().mockResolvedValue(100000) };
  const setup = await readRunningConfiguration(c);
  expect(setup.encoders.map(encoder => encoder.resolution)).toEqual([0, 0, 0, 2048]);
  expect(setup.encoders[3].reversed).toBe(true);
});
