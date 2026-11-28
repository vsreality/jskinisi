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

it('gates the oriented initializer and field 7 independently of v0.4 storage', async () => {
  const c = new KinisiSession();
  c.ready = true;
  c._sendRequest = vi.fn();
  const flags = [true, false, false, false, false, true, false, false];
  const args = [...flags, .4, .3, .1, 2048];
  c.boardInfo = { ...info, board_minor: 3, protocol_minor: 24 };
  await expect(c.initialize_mecanum_platform_oriented(...args, 1)).rejects.toThrow('2.25');
  await expect(c.getMecanumRollerOrientation()).rejects.toThrow('2.25');
  c.boardInfo = { ...c.boardInfo, protocol_minor: 25, protocol_major: 3 };
  await expect(c.getMecanumRollerOrientation()).rejects.toThrow('2.25');
  expect(c._sendRequest).not.toHaveBeenCalled();
  c.boardInfo = { ...c.boardInfo, protocol_major: 2 };
  await expect(c.save_configuration()).rejects.toThrow('known v0.4');
  await expect(c.get_configuration_field(0, 0)).rejects.toThrow('known v0.4');
  await expect(c.get_configuration_field(7, 1)).rejects.toThrow('index zero');
  for (const bad of [2, true, NaN, '1']) {
    await expect(c.initialize_mecanum_platform_oriented(...args, bad)).rejects.toThrow('roller arrangement');
  }
  await expect(c.initialize_mecanum_platform_oriented(...flags, .4, .4, .1, 0, 1)).rejects.toThrow('yaw');
  expect(c._sendRequest).not.toHaveBeenCalled();
  c._sendRequest.mockResolvedValue(new ArrayBuffer(0));
  await c.initialize_mecanum_platform_oriented(...args, 1);
  const [command, payload] = c._sendRequest.mock.lastCall;
  expect(command).toBe(0x87);
  expect(payload.byteLength).toBe(41);
  expect([...new Uint8Array(payload, 0, 8)]).toEqual([1,0,0,0,0,1,0,0]);
  const view = new DataView(payload);
  expect([8,16,24,32].map(offset => view.getFloat64(offset, true))).toEqual([.4,.3,.1,2048]);
  expect(view.getUint8(40)).toBe(1);
  await c.initialize_mecanum_platform_oriented(...flags, .4, .4, .1, 0, 0);
  expect(new DataView(c._sendRequest.mock.lastCall[1]).getUint8(40)).toBe(0);
  for (const orientation of [0, 1, 2, NaN]) {
    const scalar = new ArrayBuffer(8);
    new DataView(scalar).setFloat64(0, orientation, true);
    c._sendRequest.mockResolvedValue(scalar);
    if (orientation === 0 || orientation === 1) expect(await c.getMecanumRollerOrientation()).toBe(orientation);
    else await expect(c.getMecanumRollerOrientation()).rejects.toThrow('unknown mecanum');
    expect(c._sendRequest).toHaveBeenLastCalledWith(GET_CONFIGURATION_FIELD, new Uint8Array([7,0]).buffer, 8, false);
  }
});

it('reads the running orientation only for a 2.25+ Mecanum configuration', async () => {
  const c = { boardInfo:{ ...info, protocol_minor:25 }, get_pwm_frequency:vi.fn(async () => 25000),
    get_configuration_field:vi.fn(async field => [3,.1,.4,.3,2048,0,0,1][field]) };
  expect((await readRunningConfiguration(c)).rollerOrientation).toBe(1);
  expect(c.get_configuration_field).toHaveBeenCalledWith(7,0);
  c.get_configuration_field.mockClear(); c.boardInfo.protocol_minor = 24;
  expect((await readRunningConfiguration(c)).rollerOrientation).toBe(0);
  expect(c.get_configuration_field).not.toHaveBeenCalledWith(7,0);
});
it('sends the original Omni geometry followed by W2 position and reads field 8 on every 2.26 board', async () => {
  const c = new KinisiSession();
  c.ready = true;
  c._sendRequest = vi.fn();
  const flags = [true, false, false, false, true, false];
  const geometry = [...flags, .1, .15, 2048];
  for (const version of [{protocol_minor:25}, {protocol_major:3, protocol_minor:26}]) {
    c.boardInfo = {...info, ...version};
    expect(c.supportsOmniOrientation()).toBe(false);
    await expect(c.initialize_omni_platform_oriented(...geometry, 1)).rejects.toThrow('2.26');
    await expect(c.getOmniWheelOrientation()).rejects.toThrow('2.26');
  }
  c.boardInfo = {...info, board_minor:3, protocol_minor:26};
  expect(c.supportsOmniOrientation()).toBe(true);
  for (const bad of [true, '1', -1, 2, NaN]) {
    await expect(c.initialize_omni_platform_oriented(...geometry, bad)).rejects.toThrow('wheel arrangement');
  }
  for (const [d,r,e] of [[0,.15,0],[.1,Infinity,0],[.1,.15,-1],[Number.MIN_VALUE,.15,0],[.1,Number.MIN_VALUE,0]]) {
    await expect(c.initialize_omni_platform_oriented(...flags, d,r,e,1)).rejects.toThrow('dimensions');
  }
  await expect(c.initialize_omni_platform_oriented(2, ...geometry.slice(1), 1)).rejects.toThrow('reversal');
  await expect(c.get_configuration_field(8, 1)).rejects.toThrow('index zero');
  await expect(c.get_configuration_field(8, 256)).rejects.toThrow('unsigned bytes');
  expect(c._sendRequest).not.toHaveBeenCalled();
  for (const orientation of [0, 1]) {
    c._sendRequest.mockResolvedValue(new ArrayBuffer(0));
    await c.initialize_omni_platform_oriented(...geometry, orientation);
    const [command, payload] = c._sendRequest.mock.lastCall;
    expect(command).toBe(0x88);
    expect(payload.byteLength).toBe(31);
    expect([...new Uint8Array(payload,0,6)]).toEqual([1,0,0,0,1,0]);
    const view = new DataView(payload);
    expect([6,14,22].map(offset => view.getFloat64(offset,true))).toEqual([.1,.15,2048]);
    expect(view.getUint8(30)).toBe(orientation);
    const scalar = new ArrayBuffer(8);
    new DataView(scalar).setFloat64(0, orientation, true);
    c._sendRequest.mockResolvedValue(scalar);
    expect(await c.getOmniWheelOrientation()).toBe(orientation);
    expect(c._sendRequest).toHaveBeenLastCalledWith(GET_CONFIGURATION_FIELD,new Uint8Array([8,0]).buffer,8,false);
  }
  const badScalar = new ArrayBuffer(8);
  new DataView(badScalar).setFloat64(0, NaN, true);
  c._sendRequest.mockResolvedValue(badScalar);
  await expect(c.getOmniWheelOrientation()).rejects.toThrow('unknown omni');
});

it('reads the applied Omni position on 2.26 and defaults to rear on 2.25', async () => {
  const c = { boardInfo:{...info,protocol_minor:26}, get_pwm_frequency:vi.fn(async()=>25000),
    get_configuration_field:vi.fn(async field=>[2,.1,0,.15,2048,0,0,0,1][field]) };
  expect((await readRunningConfiguration(c)).wheelOrientation).toBe(1);
  expect(c.get_configuration_field).toHaveBeenCalledWith(8,0);
  c.get_configuration_field.mockClear();
  c.boardInfo.protocol_minor = 25;
  expect((await readRunningConfiguration(c)).wheelOrientation).toBe(0);
  expect(c.get_configuration_field).not.toHaveBeenCalledWith(8,0);
});
