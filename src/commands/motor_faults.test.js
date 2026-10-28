import { it, expect, vi } from 'vitest';
import { Commands, GET_MOTOR_FAULTS, CLEAR_MOTOR_FAULTS, Topic, MotorFaultSample, decodeTelemetryEvent } from './kinisi_commands';
import { KinisiSession } from './kinisi_session';
import { supportsMotorFaults } from './board_profile';
import { supportsTopic } from './telemetry';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 8 };
it('decodes all four motors and preserves unavailable status without calling initialization', async () => {
  const client = new Commands();
  const bytes = new Uint8Array(14); bytes[3] = 1; bytes[8] = 1;
  client._request = vi.fn().mockResolvedValue(bytes.subarray(2, 12));
  for (let index = 0; index < 4; ++index) {
    const status = await client.get_motor_faults(index);
    expect(status.status_valid).toBe(true); expect(status.overcurrent).toBe(true);
    expect(client._request).toHaveBeenLastCalledWith(GET_MOTOR_FAULTS, new Uint8Array([index]).buffer, 10);
  }
  client._request.mockResolvedValue(new Uint8Array(10));
  expect((await client.get_motor_faults(0)).status_valid).toBe(false);
});

it('rejects invalid indices, lengths and non-boolean flags', async () => {
  const client = new Commands(); client._request = vi.fn();
  for (const index of [-1, 4, 255, .5, '0', true, undefined, NaN])
    await expect(client.get_motor_faults(index)).rejects.toThrow('motor_index');
  expect(client._request).not.toHaveBeenCalled();
  for (const size of [0, 9, 11]) {
    client._request.mockResolvedValue(new Uint8Array(size));
    await expect(client.get_motor_faults(0)).rejects.toThrow('payload bytes');
  }
  for (let offset = 0; offset < 10; ++offset) {
    const bytes = new Uint8Array(10); bytes[offset] = 2;
    client._request.mockResolvedValue(bytes);
    await expect(client.get_motor_faults(0)).rejects.toThrow('Invalid motor fault flags');
  }
});

it('decodes fault subscriptions with exact timestamps and rejects malformed flags', () => {
  const sample = new MotorFaultSample(2n ** 55n + 7n, 0, 1, false, true, true, false, false, false, true, false, false, false);
  const event = new Uint8Array([Topic.MOTOR_FAULTS, 3, ...new Uint8Array(sample.encode())]);
  expect(decodeTelemetryEvent(event)).toEqual({ topic: Topic.MOTOR_FAULTS, index: 3, sample });
  event[13] = 2;
  expect(() => decodeTelemetryEvent(event)).toThrow('Invalid motor fault flags');
});

it('gates pulls and subscriptions by hardware and protocol before transmission', async () => {
  for (let index = 0; index < 4; ++index) {
    expect(supportsMotorFaults(info, index)).toBe(true);
    expect(supportsTopic(info, Topic.MOTOR_FAULTS, index)).toBe(true);
  }
  for (const boardInfo of [{ ...info, protocol_minor: 7 }, ...[1, 2, 3].map(board_minor => ({ ...info, board_minor }))]) {
    const client = new KinisiSession(); client.ready = true; client.boardInfo = boardInfo;
    client._sendRequest = vi.fn();
    expect(client.supportsMotorFaults()).toBe(false);
    await expect(client.get_motor_faults(0)).rejects.toThrow();
    await expect(client.subscribe({ topic: Topic.MOTOR_FAULTS, index: 0, intervalMs: 100 }, vi.fn())).rejects.toThrow();
    expect(client._sendRequest).not.toHaveBeenCalled();
  }
  expect(supportsMotorFaults({ ...info, board_minor: 99 })).toBe(false);
});


it('clears faults with one indexed command and decodes the actual post-clear state', async () => {
  const client = new Commands();
  client._request = vi.fn().mockResolvedValue(new Uint8Array([0, 1, 1, 0, 0, 0, 1, 0, 0, 0]));
  for (let index = 0; index < 4; ++index) {
    const status = await client.clear_motor_faults(index);
    expect(status.status_valid && status.fault_active && status.overcurrent).toBe(true);
    expect(client._request).toHaveBeenLastCalledWith(CLEAR_MOTOR_FAULTS, new Uint8Array([index]).buffer, 10);
  }
  client._request.mockClear();
  for (const index of [-1, 4, .5, '0', true, undefined]) await expect(client.clear_motor_faults(index)).rejects.toThrow('motor_index');
  expect(client._request).not.toHaveBeenCalled();
  client._request.mockResolvedValue(new Uint8Array(9));
  await expect(client.clear_motor_faults(0)).rejects.toThrow('payload bytes');
  client._request.mockResolvedValue(new Uint8Array([0, 2, 0, 0, 0, 0, 0, 0, 0, 0]));
  await expect(client.clear_motor_faults(0)).rejects.toThrow('flags');
});

it('gates clear requests by protocol and hardware without affecting ordinary reads', async () => {
  for (const boardInfo of [{ ...info, protocol_minor: 9 }, ...[1, 2, 3].map(board_minor => ({ ...info, board_minor, protocol_minor: 10 }))]) {
    const client = new KinisiSession(); client.ready = true; client.boardInfo = boardInfo;
    client._sendRequest = vi.fn();
    await expect(client.clear_motor_faults(0)).rejects.toThrow();
    expect(client._sendRequest).not.toHaveBeenCalled();
  }
});
