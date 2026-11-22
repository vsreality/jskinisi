import { expect, it, vi } from 'vitest';
import { Commands, SET_BOARD_IDLE, GET_BOARD_IDLE, ErrorCode, Topic, SUBSCRIBE_CONFIGURED } from './kinisi_commands';
import { KinisiSession, ControllerError } from './kinisi_session';
import { supportsBoardIdle } from './board_profile';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 16 };

it('gates board idle before transmission while retaining protocol 2.15 driver sleep', async () => {
  const c = new KinisiSession(); c.boardInfo = info; c._sendRequest = vi.fn();
  expect(c.supportsBoardIdle()).toBe(false);
  await expect(c.set_board_idle(1)).rejects.toThrow('not ready');
  await expect(c.get_board_idle()).rejects.toThrow('not ready');
  c.ready = true;
  for (const board of [null, { ...info, protocol_minor: 15 }, { ...info, protocol_major: 3 },
    { ...info, protocol_minor: '16' }, { ...info, board_patch: 1 }, { ...info, board_model: 2 },
    ...[1, 2, 3].map(board_minor => ({ ...info, board_minor }))]) {
    c.boardInfo = board;
    expect(supportsBoardIdle(board)).toBe(false);
    await expect(c.set_board_idle(1)).rejects.toThrow('protocol 2.16');
    await expect(c.get_board_idle()).rejects.toThrow('protocol 2.16');
  }
  expect(c._sendRequest).not.toHaveBeenCalled();
  c.boardInfo = { ...info, protocol_minor: 15 };
  expect(c.supportsDriverSleep()).toBe(true);
  c._sendRequest.mockResolvedValue(new ArrayBuffer(0));
  await expect(c.set_driver_sleep(1)).resolves.toBeUndefined();
});

it('encodes one-byte state and rejects coercion or malformed readback', async () => {
  const c = new Commands(); c._request = vi.fn().mockResolvedValue(new ArrayBuffer(0));
  for (const idle of [1, 0]) {
    await expect(c.set_board_idle(idle)).resolves.toBeUndefined();
    expect(c._request).toHaveBeenLastCalledWith(SET_BOARD_IDLE, new Uint8Array([idle]).buffer, 0);
  }
  c._request.mockClear();
  for (const invalid of [-1, 2, 256, 0.5, '1', true, null, undefined, NaN])
    await expect(c.set_board_idle(invalid)).rejects.toThrow('idle must');
  expect(c._request).not.toHaveBeenCalled();
  for (const data of [new Uint8Array(0), new Uint8Array(2), new Uint8Array([2])]) {
    c._request.mockResolvedValue(data);
    await expect(c.get_board_idle()).rejects.toThrow();
  }
  c._request.mockResolvedValue(new Uint8Array([99, 1, 99]).subarray(1, 2));
  await expect(c.get_board_idle()).resolves.toBe(1);
  expect(c._request).toHaveBeenLastCalledWith(GET_BOARD_IDLE, new ArrayBuffer(0), 1);
});

it('invalidates cached samples while retaining subscriptions and typed failures', async () => {
  const c = new KinisiSession(); c.ready = true; c.boardInfo = info;
  c._sendRequest = vi.fn().mockResolvedValue(new Uint8Array([1]));
  const entry = { latest: { value: 10 }, closing: false };
  c._telemetryListeners.set('3:0', entry); c._subscriptionSamples.set(0, { value: 10 });
  await expect(c.get_board_idle()).resolves.toBe(1);
  expect(c._subscriptionSamples.size).toBe(0);
  expect(c._telemetryListeners.get('3:0')).toBe(entry);
  expect(entry.closing).toBe(false); expect(entry.latest).toBeNull();
  const error = new ControllerError(ErrorCode.BOARD_IDLE, 0, 3);
  expect(error.code).toBe(20);
  c._sendRequest.mockRejectedValue(error);
  await expect(c.set_driver_sleep(0)).rejects.toBe(error);
  const failed = new ControllerError(ErrorCode.INTERNAL_ERROR, SET_BOARD_IDLE, 4);
  c._subscriptionSamples.set(0, { value: 20 });
  c._sendRequest.mockRejectedValue(failed);
  await expect(c.set_board_idle(0)).rejects.toBe(failed);
  expect(c._subscriptionSamples.size).toBe(0);
});

it('discards scheduled pre-idle deliveries but keeps fresh callbacks on the same subscription', async () => {
  const c = new KinisiSession(); c.ready = true; c.boardInfo = info;
  c._sendRequest = vi.fn().mockResolvedValue(new ArrayBuffer(0));
  const entry = { closing: false, callback: vi.fn() };
  c._telemetryListeners.set('3:0', entry);
  c._deliverTelemetry('3:0', entry, { celsius: 20 });
  await c.set_board_idle(1);
  await Promise.resolve();
  expect(entry.callback).not.toHaveBeenCalled();
  c._deliverTelemetry('3:0', entry, { celsius: 21 });
  await Promise.resolve();
  expect(entry.callback).toHaveBeenCalledExactlyOnceWith({ celsius: 21 });
});

it('refreshes the exact subscription at its ACK boundary while retaining handle ownership', async () => {
  const c = new KinisiSession(); c.ready = true; c.boardInfo = info;
  c._session = {}; c._heartbeatIntervalMs = 1000;
  c._sendRequest = vi.fn().mockResolvedValue(new ArrayBuffer(0));
  const callback = vi.fn();
  const handle = await c.subscribe({ topic: Topic.MOTOR_FAULTS, index: 0, trigger: 1,
    delivery: 1, pollIntervalMs: 0, maxSilenceMs: 0 }, callback);
  const key = Topic.MOTOR_FAULTS + ':0', entry = c._telemetryListeners.get(key);
  const original = c._sendRequest.mock.calls[0];
  let ack;
  c._sendRequest.mockImplementationOnce(() => new Promise(resolve => { ack = resolve; }));
  c._deliverTelemetry(key, entry, { queuedBeforeRefresh: true });
  const pending = handle.refresh();
  await Promise.resolve(); await Promise.resolve();
  c._deliverTelemetry(key, entry, { stale: true });
  await Promise.resolve();
  expect(callback).not.toHaveBeenCalled();
  ack(new ArrayBuffer(0));
  await pending;
  expect(c._sendRequest.mock.calls[1]).toEqual(original);
  expect(original[0]).toBe(SUBSCRIBE_CONFIGURED);
  expect(c._telemetryListeners.get(key)).toBe(entry);
  expect(handle.active).toBe(true);
  c._deliverTelemetry(key, entry, { fresh: true });
  await Promise.resolve();
  expect(callback).toHaveBeenCalledExactlyOnceWith({ fresh: true });
  // An unsuccessful rearm cannot expose the old stream as newly verified.
  c._sendRequest.mockRejectedValueOnce(new Error('Readback unavailable'));
  await expect(handle.refresh()).rejects.toThrow('Readback unavailable');
  c._deliverTelemetry(key, entry, { stale: true });
  await Promise.resolve();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(handle.active).toBe(true);
  await handle.refresh();
  c._deliverTelemetry(key, entry, { recovered: true });
  await Promise.resolve();
  expect(callback).toHaveBeenCalledTimes(2);
  await handle.unsubscribe();
  expect(handle.active).toBe(false);
  await expect(handle.refresh()).rejects.toThrow('no longer active');
});
