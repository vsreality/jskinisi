import { describe, it, expect, vi } from 'vitest';
import { Commands, ImuTrackingAction, SET_IMU_TRACKING, ErrorCode } from './kinisi_commands';
import { KinisiSession, ControllerError } from './kinisi_session';
const info={board_model:1,board_major:0,board_minor:4,board_patch:0,protocol_major:2,protocol_minor:20};
describe('IMU-only tracking SDK',()=>{
  it('gates exact profile and READY with no automatic actions',async()=>{
    const c=new KinisiSession();c.boardInfo=info;c._sendRequest=vi.fn();
    expect(c.supportsImuTracking()).toBe(false);await expect(c.get_imu_tracking_status()).rejects.toThrow('not ready');c.ready=true;
    for(const override of [{protocol_minor:19},{protocol_major:3},{protocol_minor:'20'},{protocol_minor:256},{board_minor:3},{board_minor:3,board_patch:1},{board_patch:1},{board_model:2}]){
      c.boardInfo={...info,...override};expect(c.supportsImuTracking()).toBe(false);
      for(const call of [()=>c.set_imu_tracking(0,1,0),()=>c.get_imu_tracking_status(),()=>c.get_imu_tracking_vector(0),()=>c.get_imu_tracking_configuration()])await expect(call()).rejects.toThrow('2.20');
    }
    expect(c._sendRequest).not.toHaveBeenCalled();c.boardInfo=info;expect(c.supportsImuTracking()).toBe(true);
    const error=new ControllerError(ErrorCode.INVALID_ARGUMENT,SET_IMU_TRACKING,1);c._sendRequest.mockRejectedValue(error);
    await expect(c.set_imu_tracking(0,1,0)).rejects.toBe(error);expect(c.ready).toBe(true);expect(c._sendRequest).toHaveBeenCalledTimes(1);
  });
  it('packs Wire32 frames and keeps timestamp precision',async()=>{
    const c=new Commands();c._request=vi.fn().mockResolvedValue(new ArrayBuffer(0));
    for(const action of [ImuTrackingAction.START,ImuTrackingAction.RESET,ImuTrackingAction.RECALIBRATE]){
      await c.set_imu_tracking(action,1,Math.PI);const [code,payload,size]=c._request.mock.calls.at(-1);
      expect([code,payload.byteLength,size]).toEqual([0x63,10,0]);expect(new DataView(payload).getFloat64(2,true)).toBe(Math.PI);
    }
    await c.set_imu_tracking(ImuTrackingAction.STOP,0,0);
    const data=new ArrayBuffer(28),v=new DataView(data);v.setUint8(0,2);v.setUint8(2,3);v.setUint32(4,42,true);v.setBigUint64(8,2n**60n+7n,true);v.setUint32(16,500,true);v.setUint32(20,10,true);v.setUint32(24,20,true);c._request.mockResolvedValue(data);
    expect(await c.get_imu_tracking_status()).toMatchObject({sequence:42,timestamp_us:2n**60n+7n,elapsed_us:500,accel_age_us:10,gyro_age_us:20});
    expect(c._request.mock.calls.at(-1).map((x,i)=>i===1?x.byteLength:x)).toEqual([0x64,0,28]);
    v.setFloat64(4,1.25,true);v.setFloat64(12,-2,true);v.setFloat64(20,.5,true);expect(await c.get_imu_tracking_vector(0)).toMatchObject({x:1.25,y:-2,z:.5});
    const config=new ArrayBuffer(12);new DataView(config).setUint32(8,5000000,true);c._request.mockResolvedValue(config);expect((await c.get_imu_tracking_configuration()).window_us).toBe(5000000);
  });
  it('rejects coercion, invalid declarations and malformed diagnostics',async()=>{
    const c=new Commands();c._request=vi.fn();
    for(const args of [[0,0,0],[1,1,0],[1,0,1],[4,1,0],[true,1,0],[0,true,0],[0,1,true],[0,1,NaN],[0,1,Infinity],[0,1,4],[0,1,'0']])await expect(c.set_imu_tracking(...args)).rejects.toThrow();
    for(const kind of [-1,3,true,'0',.5])await expect(c.get_imu_tracking_vector(kind)).rejects.toThrow();expect(c._request).not.toHaveBeenCalled();
    for(const bytes of [new Uint8Array(27),new Uint8Array([5,...Array(27).fill(0)]),new Uint8Array([0,0,0,1,...Array(24).fill(0)])]){c._request.mockResolvedValue(bytes);await expect(c.get_imu_tracking_status()).rejects.toThrow();}
    c._request.mockResolvedValue(new ArrayBuffer(12));await expect(c.get_imu_tracking_configuration()).rejects.toThrow();
    const vector=new ArrayBuffer(28);new DataView(vector).setFloat64(4,NaN,true);c._request.mockResolvedValue(vector);await expect(c.get_imu_tracking_vector(0)).rejects.toThrow();
  });
});
