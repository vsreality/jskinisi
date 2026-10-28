import { it, expect, vi } from 'vitest';
import { Commands, GET_MOTOR_CURRENT_LIMIT, SET_MOTOR_CURRENT_LIMIT, MotorCurrentLimit } from './kinisi_commands';
import { KinisiSession } from './kinisi_session';
import { getMotorCurrentLimitOptions, supportsMotorCurrentLimit } from './board_profile';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 11 };
it('encodes numeric milliamps for each motor and decodes the applied setting', async () => {
  const c = new Commands(); c._request = vi.fn().mockResolvedValue(new Uint8Array([1, 0x18, 0x15]));
  for (let index = 0; index < 4; ++index) {
    expect(await c.set_motor_current_limit(index, true, 5400)).toEqual({ enabled: true, threshold_ma: 5400 });
    expect(c._request).toHaveBeenLastCalledWith(SET_MOTOR_CURRENT_LIMIT, new Uint8Array([index, 1, 0x18, 0x15]).buffer, 3);
    await c.get_motor_current_limit(index);
    expect(c._request).toHaveBeenLastCalledWith(GET_MOTOR_CURRENT_LIMIT, new Uint8Array([index]).buffer, 3);
  }
  c._request.mockClear();
  for (const index of [-1, 4, true, .5]) await expect(c.set_motor_current_limit(index, true, 5400)).rejects.toThrow();
  for (const value of [0, 65536, true, '5400', 5400.5, NaN]) await expect(c.set_motor_current_limit(0, true, value)).rejects.toThrow();
  for (const value of [0, 1, 'true']) await expect(c.set_motor_current_limit(0, value, 5400)).rejects.toThrow();
  expect(c._request).not.toHaveBeenCalled();
  for (const value of [[], [1, 0], [1, 0, 0], [2, 0x18, 0x15], [1, 0x18, 0x15, 0]])
    expect(() => MotorCurrentLimit.decode(new Uint8Array(value))).toThrow();
});

it('exposes immutable options and validates hardware, firmware and thresholds before I/O', async () => {
  for (let index = 0; index < 4; ++index) {
    expect(supportsMotorCurrentLimit(info, index)).toBe(true);
    const options = getMotorCurrentLimitOptions(info, index);
    expect(options.supported_thresholds_ma).toEqual([4000, 5400, 6500, 7000]);
    expect(Object.isFrozen(options.supported_thresholds_ma)).toBe(true);
  }
  for (const boardInfo of [{ ...info, protocol_minor: 10 }, ...[1, 2, 3].map(board_minor => ({ ...info, board_minor }))]) {
    const c = new KinisiSession(); c.ready = true; c.boardInfo = boardInfo; c._sendRequest = vi.fn();
    expect(c.supportsMotorCurrentLimit()).toBe(false);
    await expect(c.get_motor_current_limit(0)).rejects.toThrow();
    await expect(c.set_motor_current_limit(0, true, 5400)).rejects.toThrow();
    expect(c._sendRequest).not.toHaveBeenCalled();
  }
  const c = new KinisiSession(); c.ready = true; c.boardInfo = info;
  c._sendRequest = vi.fn().mockResolvedValue(new Uint8Array([1, 0x18, 0x15]));
  await expect(c.set_motor_current_limit(0, true, 5000)).rejects.toThrow('not allowed');
  expect(c._sendRequest).not.toHaveBeenCalled();
  await c.set_motor_current_limit(0, false, 5400);
  expect(c._sendRequest).toHaveBeenCalledOnce();
  c.boardInfo = { ...info, board_minor: 99 };
  expect(c.getMotorCurrentLimitOptions()).toBeNull();
  expect(c.supportsMotorCurrentLimit()).toBe(false);
  await c.set_motor_current_limit(0, true, 5000); // Unknown profiles defer explicit requests to firmware.
  c.boardInfo = null;
  expect(c.getMotorCurrentLimitOptions()).toBeNull();
});
