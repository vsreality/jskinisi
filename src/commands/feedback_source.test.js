import { describe, expect, it, vi } from 'vitest';
import {
  FeedbackFusionMount, FeedbackSourceStatus, FeedbackSourceVector, FeedbackSource, FeedbackSourceVectorKind,
  SET_FEEDBACK_SOURCE, GET_FEEDBACK_SOURCE_STATUS, GET_FEEDBACK_SOURCE_VECTOR,
  SET_FEEDBACK_FUSION_MOUNT, GET_FEEDBACK_FUSION_MOUNT, ErrorCode,
} from './kinisi_commands';
import { KinisiSession, ControllerError, ConnectionClosedError } from './kinisi_session';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 21 };
const stamp = (1n << 60n) + 7n;
const status = (source, origin = 3, valid = 1, reason = 0) => new FeedbackSourceStatus(
  source, valid ? source : 255, valid, reason, valid ? 42 : 0, valid ? stamp : 0n, origin, 0, valid ? 937 : 0xffffffff);
const session = () => {
  const client = new KinisiSession();
  client.ready = true;
  client.boardInfo = info;
  client._session = {};
  client._sendRequest = vi.fn();
  return client;
};

describe('tracking source transport', () => {
  it('reads all three sources using their real source time, age, frame and sequence', async () => {
    const c = session();
    for (const source of [FeedbackSource.ENCODER, FeedbackSource.IMU_ONLY, FeedbackSource.FUSED]) {
      c._sendRequest.mockImplementation(async (cmd, payload, size) => {
        if (cmd === GET_FEEDBACK_SOURCE_STATUS) {
          expect(size).toBe(25);
          expect(payload.byteLength).toBe(0);
          return status(source).encode();
        }
        expect(cmd).toBe(GET_FEEDBACK_SOURCE_VECTOR);
        expect(size).toBe(28);
        const kind = new Uint8Array(payload)[0];
        return new FeedbackSourceVector(42, kind === FeedbackSourceVectorKind.POSE ? 1.25 : -0.5, 0, 0.3).encode();
      });
      const sample = await c.readFeedbackSourceSnapshot();
      expect(sample.status).toMatchObject({ requested: source, active: source, sequence: 42, timestamp_us: stamp, age_us: 937 });
      expect(sample.pose.x).toBe(1.25);
      expect(sample.twist.x).toBe(-0.5);
    }
  });

  it('rejects mismatched origins even if source sequence and timestamp repeat; clears vectors on loss', async () => {
    const c = session();
    let origin = 0;
    c._sendRequest.mockImplementation(async cmd => cmd === GET_FEEDBACK_SOURCE_STATUS
      ? status(2, ++origin).encode() : new FeedbackSourceVector(42, 9, 0, 0).encode());
    await expect(c.readFeedbackSourceSnapshot()).rejects.toThrow('coherent snapshot');
    expect(c._sendRequest).toHaveBeenCalledTimes(12);
    c._sendRequest.mockReset().mockResolvedValueOnce(status(1).encode())
      .mockRejectedValueOnce(new ControllerError(ErrorCode.SAMPLE_NOT_AVAILABLE, GET_FEEDBACK_SOURCE_VECTOR, 1))
      .mockResolvedValueOnce(status(1, 3, 0, 5).encode());
    expect(await c.readFeedbackSourceSnapshot()).toMatchObject({status: { requested: 1, active: 255, reason: 5 }, pose: null, twist: null });
    expect(c._sendRequest).toHaveBeenCalledTimes(3);
    c._sendRequest.mockImplementation(async () => { c._session = {}; return status(0).encode(); });
    await expect(c.readFeedbackSourceSnapshot()).rejects.toBeInstanceOf(ConnectionClosedError);
  });

  it('guards older boards and rejects unsafe switches without writes on reconnect or retry', async () => {
    const c = session();
    for (const override of [{protocol_minor:20}, {protocol_major:3}, {board_minor:3}, {board_patch:1}]) {
      c.boardInfo = {...info, ...override};
      expect(c.supportsFeedbackSourceSelector()).toBe(false);
      for (const op of [() => c.set_feedback_source(1), () => c.get_feedback_source_status(),
        () => c.get_feedback_source_vector(0), () => c.set_feedback_fusion_mount(0), () => c.get_feedback_fusion_mount()]) {
        await expect(op()).rejects.toThrow('2.21');
      }
    }
    c.boardInfo = info;
    for (const value of [true, '1', -1, 3, 255, 0.5]) await expect(c.set_feedback_source(value)).rejects.toThrow();
    for (const value of [true, '1', -1, 2]) await expect(c.get_feedback_source_vector(value)).rejects.toThrow();
    for (const value of [NaN, Infinity, -4, '0']) await expect(c.set_feedback_fusion_mount(value)).rejects.toThrow();
    expect(c._sendRequest).not.toHaveBeenCalled();
    const denied = new ControllerError(ErrorCode.SOURCE_SWITCH_UNSAFE, SET_FEEDBACK_SOURCE, 8);
    c._sendRequest.mockRejectedValueOnce(denied);
    await expect(c.set_feedback_source(2)).rejects.toBe(denied);
    expect(c._sendRequest).toHaveBeenCalledTimes(1);
    c._sendRequest.mockResolvedValueOnce(new ArrayBuffer(0));
    await c.set_feedback_fusion_mount(-Math.PI);
    const [code, payload] = c._sendRequest.mock.calls.at(-1);
    expect(code).toBe(SET_FEEDBACK_FUSION_MOUNT);
    expect(new DataView(payload).getFloat64(0, true)).toBe(-Math.PI);
    c._sendRequest.mockResolvedValueOnce(new FeedbackFusionMount(1, -Math.PI).encode());
    expect((await c.get_feedback_fusion_mount()).confirmed).toBe(1);
    expect(c._sendRequest.mock.lastCall[0]).toBe(GET_FEEDBACK_FUSION_MOUNT);
  });

  it('rejects malformed wire results before returning samples', async () => {
    const c = session();
    for (const change of [{ requested: 4 }, {active: 1}, {valid: 2}, {reason: 1}, {reason: 10}]) {
      c._sendRequest.mockResolvedValueOnce(Object.assign(status(2), change).encode());
      await expect(c.get_feedback_source_status()).rejects.toThrow();
    }
    c._sendRequest.mockResolvedValueOnce(new FeedbackSourceVector(42, NaN, 0, 0).encode());
    await expect(c.get_feedback_source_vector(0)).rejects.toThrow();
    c._sendRequest.mockResolvedValueOnce(new Uint8Array(24));
    await expect(c.get_feedback_source_status()).rejects.toThrow();
    c._sendRequest.mockResolvedValueOnce(new FeedbackFusionMount(2, 0).encode());
    await expect(c.get_feedback_fusion_mount()).rejects.toThrow();
  });
});
