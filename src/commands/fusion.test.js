import { describe, it, expect, vi } from 'vitest';
import { Commands, FusionMode, FusionVectorKind, SET_FUSION_EXPERIMENT, GET_FUSION_STATUS, GET_FUSION_VECTOR, GET_FUSION_CONFIGURATION, ErrorCode } from './kinisi_commands';
import { KinisiSession, ControllerError } from './kinisi_session';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 19 };
describe('fusion experiment', () => {
  it('gates exact hardware and READY without changing older defaults', async () => {
    const c = new KinisiSession(); c.boardInfo = info; c._sendRequest = vi.fn();
    expect(c.supportsFusionExperiment()).toBe(false);
    await expect(c.set_fusion_experiment(2, 0)).rejects.toThrow('not ready');
    c.ready = true;
    for (const override of [{ protocol_minor: 18 }, { protocol_major: 3 }, { protocol_minor: '19' },
      { protocol_minor: 256 }, { board_minor: 3 }, { board_minor: 3, board_patch: 1 }, { board_patch: 1 }, { board_model: 2 }]) {
      c.boardInfo = { ...info, ...override };
      expect(c.supportsFusionExperiment()).toBe(false);
      for (const call of [() => c.set_fusion_experiment(2, 0), () => c.get_fusion_status(), () => c.get_fusion_vector(0), () => c.get_fusion_configuration()])
        await expect(call()).rejects.toThrow('2.19');
    }
    expect(c._sendRequest).not.toHaveBeenCalled();
    c.boardInfo = info; expect(c.supportsFusionExperiment()).toBe(true);
    const error = new ControllerError(ErrorCode.INVALID_ARGUMENT, SET_FUSION_EXPERIMENT, 1);
    c._sendRequest.mockRejectedValue(error);
    await expect(c.set_fusion_experiment(FusionMode.FUSED, 0)).rejects.toBe(error);
    expect(c.ready).toBe(true); expect(c._sendRequest).toHaveBeenCalledTimes(1);
  });
  it('keeps packed payloads within Wire32 and preserves uint64 timestamps', async () => {
    const c = new Commands(); c._request = vi.fn().mockResolvedValue(new ArrayBuffer(0));
    await c.set_fusion_experiment(FusionMode.FUSED, -.5);
    const [code, request, size] = c._request.mock.calls[0];
    expect([code, request.byteLength, size]).toEqual([0x5f, 9, 0]);
    expect(new DataView(request).getFloat64(1, true)).toBe(-.5);
    const status = new ArrayBuffer(28), view = new DataView(status);
    view.setUint8(0, 2); view.setUint8(1, 2); view.setUint8(3, 3); view.setUint32(4, 42, true);
    view.setBigUint64(8, 2n ** 60n + 7n, true); view.setUint32(16, 10, true);
    c._request.mockResolvedValue(status);
    expect((await c.get_fusion_status()).timestamp_us).toBe(2n ** 60n + 7n);
    expect(c._request).toHaveBeenLastCalledWith(GET_FUSION_STATUS, new ArrayBuffer(0), 28);
    const vector = new ArrayBuffer(28), v = new DataView(vector);
    v.setUint32(0, 42, true); v.setFloat64(4, 1.25, true); v.setFloat64(12, -2, true); v.setFloat64(20, .5, true);
    c._request.mockResolvedValue(vector);
    expect(await c.get_fusion_vector(FusionVectorKind.FUSED_POSE)).toMatchObject({ sequence: 42, x: 1.25, y: -2, z: .5 });
    expect(c._request).toHaveBeenLastCalledWith(GET_FUSION_VECTOR, new Uint8Array([2]).buffer, 28);
    const config = new ArrayBuffer(9); new DataView(config).setFloat64(1, -.5, true);
    c._request.mockResolvedValue(config);
    expect((await c.get_fusion_configuration()).mounting_yaw_rad).toBe(-.5);
    expect(c._request).toHaveBeenLastCalledWith(GET_FUSION_CONFIGURATION, new ArrayBuffer(0), 9);
  });
  it('rejects coercion and invalid snapshots', async () => {
    const c = new Commands(); c._request = vi.fn();
    for (const [mode, yaw] of [[3,0],[-1,0],[true,0],['2',0],[2,NaN],[2,Infinity],[2,4],[2,'0'],[2,true]])
      await expect(c.set_fusion_experiment(mode, yaw)).rejects.toThrow();
    for (const kind of [-1,5,true,'0',.5]) await expect(c.get_fusion_vector(kind)).rejects.toThrow();
    expect(c._request).not.toHaveBeenCalled();
    const data = new Uint8Array(28); data[0] = 3; c._request.mockResolvedValue(data);
    await expect(c.get_fusion_status()).rejects.toThrow('Invalid fusion status');
    data.fill(0); new DataView(data.buffer).setFloat64(4, NaN, true);
    await expect(c.get_fusion_vector(0)).rejects.toThrow('Invalid fusion vector');
    c._request.mockResolvedValue(new ArrayBuffer(27));
    await expect(c.get_fusion_status()).rejects.toThrow();
  });
});
