import {describe, expect, it, vi} from 'vitest';
import {KinisiSession} from './kinisi_session';
import {FeedbackImuChannels, FeedbackSourceHealth, FeedbackSourceMismatchError, FeedbackSourceHealthFlag as F,
  GET_FEEDBACK_SOURCE_HEALTH, GET_FEEDBACK_IMU_CHANNELS} from './kinisi_commands';

const board = {board_model:1,board_major:0,board_minor:4,board_patch:0,protocol_major:2,protocol_minor:22};
function session() {
  const c=new KinisiSession(); c.ready=true; c.boardInfo={...board}; c._session={};
  c._sendRequest=vi.fn();
  return c;
}
describe('source health wire contract',()=>{
  it('reads all three producer reports with independent state, age, flags and 64-bit provenance',async()=>{
    const c=session(), stamp=2n**60n+17n;
    for (const source of [0,1,2]) {
      const bytes=new ArrayBuffer(28), v=new DataView(bytes);
      v.setUint8(0,source);v.setUint8(1,2);v.setUint8(2,4);v.setUint8(3,4);
      v.setUint32(4,F.PROVENANCE|F.RECOVERING,true);v.setUint32(8,0xfffffffe,true);
      v.setBigUint64(12,stamp,true);v.setUint32(20,45001,true);v.setUint32(24,35000,true);
      c._sendRequest.mockResolvedValueOnce(bytes);
      expect(await c.get_feedback_source_health(source)).toEqual(new FeedbackSourceHealth(
        source,2,4,4,17,0xfffffffe,stamp,45001,35000));
      const [cmd,payload]=c._sendRequest.mock.lastCall;
      expect(cmd).toBe(GET_FEEDBACK_SOURCE_HEALTH);expect([...new Uint8Array(payload)]).toEqual([source]);
    }
    const bytes=new ArrayBuffer(24), v=new DataView(bytes);
    v.setBigUint64(0,stamp,true);v.setBigUint64(8,0n,true);
    v.setUint32(16,20000,true);v.setUint32(20,0xffffffff,true);
    c._sendRequest.mockResolvedValueOnce(bytes);
    expect(await c.get_feedback_imu_channels()).toEqual(new FeedbackImuChannels(stamp,0n,20000,0xffffffff));
    const [cmd,payload]=c._sendRequest.mock.lastCall;
    expect(cmd).toBe(GET_FEEDBACK_IMU_CHANNELS);expect(payload.byteLength).toBe(0);
  });
  it('rejects unsupported requests locally while preserving the 2.21 selector',async()=>{
    const c=session();c.boardInfo.protocol_minor=21;
    expect(c.supportsFeedbackSourceSelector()).toBe(true);
    for (const info of [{protocol_minor:21},{protocol_major:3},{board_minor:3},{board_patch:1},{board_model:2}]) {
      c.boardInfo={...board,...info};expect(c.supportsFeedbackSourceHealth()).toBe(false);
      await expect(c.get_feedback_source_health(0)).rejects.toThrow('2.22');
      await expect(c.get_feedback_imu_channels()).rejects.toThrow('2.22');
    }
    c.boardInfo=board;
    for (const invalid of [true,'1',-1,.5,3,255]) await expect(c.get_feedback_source_health(invalid)).rejects.toThrow();
    c.ready=false;await expect(c.get_feedback_source_health(0)).rejects.toThrow();
    expect(c._sendRequest).not.toHaveBeenCalled();
  });
  it('rejects incorrect source echoes, unknown states and malformed replies without emitting writes',async()=>{
    const c=session();
    c._sendRequest.mockResolvedValueOnce(new FeedbackSourceHealth(1,0,0,0,3,42,123n,10,35000).encode());
    const wrongSource=c.get_feedback_source_health(0);
    await expect(wrongSource).rejects.toBeInstanceOf(FeedbackSourceMismatchError);
    await expect(wrongSource).rejects.toMatchObject({requested:0,received:1});
    for (const [source,health,reason,detail] of [[0,4,0,0],[0,0,10,0],[0,0,0,10]]) {
      c._sendRequest.mockResolvedValueOnce(new FeedbackSourceHealth(source,health,reason,detail,0,0,0n,0xffffffff,35000).encode());
      await expect(c.get_feedback_source_health(0)).rejects.toThrow('Invalid feedback source health');
    }
    c._sendRequest.mockResolvedValueOnce(new ArrayBuffer(27));
    await expect(c.get_feedback_source_health(0)).rejects.toThrow();
    c._sendRequest.mockResolvedValueOnce(new FeedbackImuChannels(0n,0n,0,0xffffffff).encode());
    await expect(c.get_feedback_imu_channels()).rejects.toThrow('provenance');
    expect(c._sendRequest.mock.calls.every(([cmd])=>[GET_FEEDBACK_SOURCE_HEALTH,GET_FEEDBACK_IMU_CHANNELS].includes(cmd))).toBe(true);
  });
});
