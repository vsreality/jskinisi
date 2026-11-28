import { expect, it, vi } from 'vitest';
import { Commands, SET_DRIVER_SLEEP, GET_DRIVER_SLEEP, ErrorCode } from './kinisi_commands';
import { KinisiSession, ControllerError } from './kinisi_session';
import { supportsDriverSleep, getBoardProfile, getDriverSleepKind, supportsBoardIdle } from './board_profile';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 15 };

it('requires READY, an advertised exact board capability and compatible protocol before I/O', async () => {
  const c = new KinisiSession(); c.boardInfo = info; c._sendRequest = vi.fn();
  expect(getBoardProfile(info).power.driver_sleep).toBe(true);
  expect(c.supportsDriverSleep()).toBe(false);
  await expect(c.set_driver_sleep(1)).rejects.toThrow('not ready');
  await expect(c.get_driver_sleep()).rejects.toThrow('not ready');
  c.ready = true;
  for (const board of [null, { ...info, protocol_minor: 14 }, { ...info, protocol_major: 3 },
    { ...info, protocol_minor: '15' }, { ...info, board_patch: 1 }, { ...info, board_model: 2 },
    ...[1, 2, 3].map(board_minor => ({ ...info, board_minor }))]) {
    c.boardInfo = board;
    expect(supportsDriverSleep(board)).toBe(false);
    expect(c.supportsDriverSleep()).toBe(false);
    await expect(c.set_driver_sleep(1)).rejects.toThrow('known supported board');
    await expect(c.get_driver_sleep()).rejects.toThrow('known supported board');
  }
  expect(c._sendRequest).not.toHaveBeenCalled();
  c.boardInfo = { ...info, protocol_minor: 16 };
  expect(c.supportsDriverSleep()).toBe(true);
  c._sendRequest.mockResolvedValue(new ArrayBuffer(0));
  for (const sleeping of [1, 0]) {
    await expect(c.set_driver_sleep(sleeping)).resolves.toBeUndefined();
    expect(c._sendRequest).toHaveBeenLastCalledWith(SET_DRIVER_SLEEP, new Uint8Array([sleeping]).buffer, 0, false);
  }
  c._sendRequest.mockResolvedValue(new Uint8Array([1]));
  await expect(c.get_driver_sleep()).resolves.toBe(1);
  expect(c._sendRequest).toHaveBeenLastCalledWith(GET_DRIVER_SLEEP, new ArrayBuffer(0), 1, false);
});

it('rejects invalid sleep arguments and malformed readback without coercion', async () => {
  const c = new Commands(); c._request = vi.fn();
  for (const invalid of [-1, 2, 256, 0.5, '1', true, false, null, undefined, NaN])
    await expect(c.set_driver_sleep(invalid)).rejects.toThrow('sleeping must');
  expect(c._request).not.toHaveBeenCalled();
  for (const payload of [new Uint8Array(0), new Uint8Array(2), new Uint8Array([2]), new Uint8Array([255])]) {
    c._request.mockResolvedValue(payload);
    await expect(c.get_driver_sleep()).rejects.toThrow();
  }
  const surrounding = new Uint8Array([99, 0, 99]);
  c._request.mockResolvedValue(surrounding.subarray(1, 2));
  await expect(c.get_driver_sleep()).resolves.toBe(0);
});

it('preserves typed asleep and failed-wake errors', async () => {
  const c = new KinisiSession(); c.ready = true; c.boardInfo = info;
  const failedWake = new ControllerError(ErrorCode.INTERNAL_ERROR, SET_DRIVER_SLEEP, 42);
  c._sendRequest = vi.fn().mockRejectedValue(failedWake);
  await expect(c.set_driver_sleep(0)).rejects.toBe(failedWake);
  const asleep = new ControllerError(ErrorCode.DRIVERS_ASLEEP, 0, 43);
  expect(asleep.code).toBe(19);
  expect(asleep.message).toMatch(/wake/i);
  c._sendRequest.mockRejectedValue(asleep);
  await expect(c.set_platform_velocity(10, 0, 0)).rejects.toBe(asleep);
});

it.each([0, 1])('supports only protocol 2.17+ on exact model 1 v0.3.%s without board idle', async board_patch => {
  const c = new KinisiSession();
  const board = { ...info, board_minor: 3, board_patch, protocol_minor: 17 };
  c.boardInfo = board; c._sendRequest = vi.fn();
  expect(getBoardProfile(board).power.driver_sleep).toBe(true);
  expect(getDriverSleepKind(board)).toBe('input_low');
  expect(c.supportsDriverSleep()).toBe(false);
  await expect(c.set_driver_sleep(1)).rejects.toThrow('not ready');
  c.ready = true;
  for (const protocol_minor of [0, 14, 15, 16, '17', -1, NaN, 256]) {
    c.boardInfo = { ...board, protocol_minor };
    expect(c.supportsDriverSleep()).toBe(false);
    await expect(c.set_driver_sleep(1)).rejects.toThrow('known supported board');
    await expect(c.get_driver_sleep()).rejects.toThrow('known supported board');
  }
  expect(c._sendRequest).not.toHaveBeenCalled();
  c.boardInfo = board;
  expect(c.supportsDriverSleep()).toBe(true);
  expect(supportsBoardIdle(board)).toBe(false);
  await expect(c.set_board_idle(1)).rejects.toThrow('known supported board');
  await expect(c.get_board_idle()).rejects.toThrow('known supported board');
  expect(c._sendRequest).not.toHaveBeenCalled();
  c._sendRequest.mockResolvedValue(new ArrayBuffer(0));
  for (const sleeping of [1, 0]) {
    await c.set_driver_sleep(sleeping);
    expect(c._sendRequest).toHaveBeenLastCalledWith(SET_DRIVER_SLEEP, new Uint8Array([sleeping]).buffer, 0, false);
  }
  c._sendRequest.mockResolvedValue(new Uint8Array([0]));
  expect(await c.get_driver_sleep()).toBe(0);
  expect(supportsDriverSleep({ ...board, protocol_minor: 18 })).toBe(true);
  for (const override of [{ board_minor: 1 }, { board_minor: 2 }, { board_patch: 2 },
    { board_model: 2 }, { board_major: 1 }, { protocol_major: 3 }]) {
    c.boardInfo = { ...board, ...override };
    expect(c.supportsDriverSleep()).toBe(false);
    await expect(c.set_driver_sleep(0)).rejects.toThrow('known supported board');
  }
});
