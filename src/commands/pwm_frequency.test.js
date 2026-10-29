import { it, expect, vi } from 'vitest';
import { Commands, PwmFrequency, SET_PWM_FREQUENCY, GET_PWM_FREQUENCY } from './kinisi_commands';
import { KinisiSession } from './kinisi_session';
import { getPwmFrequencyOptions, supportsPwmFrequency } from './board_profile';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 13 };
it('encodes a board-wide uint32 frequency, with no motor index, and rejects non-enum values', async () => {
  const c = new Commands(); c._request = vi.fn().mockResolvedValue(new Uint8Array([0xa8, 0x61, 0, 0]));
  expect(await c.set_pwm_frequency(PwmFrequency.KHZ_25)).toBe(25000);
  expect(c._request).toHaveBeenLastCalledWith(SET_PWM_FREQUENCY, new Uint8Array([0xa8, 0x61, 0, 0]).buffer, 4);
  expect(await c.get_pwm_frequency()).toBe(25000);
  expect(c._request).toHaveBeenLastCalledWith(GET_PWM_FREQUENCY, new ArrayBuffer(0), 4);
  c._request.mockClear();
  for (const value of [0, 12345, 25000.5, true, '25000', NaN, 2 ** 32 + 25000])
    await expect(c.set_pwm_frequency(value)).rejects.toThrow();
  expect(c._request).not.toHaveBeenCalled();
});

it('exposes immutable options on all four boards and gates older firmware before I/O', async () => {
  for (const board_minor of [1, 2, 3, 4]) {
    const options = getPwmFrequencyOptions({ ...info, board_minor });
    expect(options.supported_hz).toEqual(Object.values(PwmFrequency));
    expect(Object.isFrozen(options.supported_hz)).toBe(true);
    expect(supportsPwmFrequency({ ...info, board_minor })).toBe(true);
  }
  const c = new KinisiSession(); c.ready = true; c.boardInfo = { ...info, protocol_minor: 12 }; c._sendRequest = vi.fn();
  await expect(c.set_pwm_frequency(PwmFrequency.KHZ_25)).rejects.toThrow('2.13');
  await expect(c.get_pwm_frequency()).rejects.toThrow('2.13');
  expect(c._sendRequest).not.toHaveBeenCalled();
  c.boardInfo = info; c._sendRequest.mockResolvedValue(new Uint8Array([0xa8, 0x61, 0, 0]));
  expect(await c.set_pwm_frequency(PwmFrequency.KHZ_25)).toBe(25000);
  c.boardInfo = { ...info, board_minor: 99 };
  expect(c.getPwmFrequencyOptions()).toBeNull(); expect(c.supportsPwmFrequency()).toBe(false);
  expect(await c.get_pwm_frequency()).toBe(25000);
  c.boardInfo = null; expect(c.getPwmFrequencyOptions()).toBeNull();
});
