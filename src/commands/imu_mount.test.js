import { describe, expect, it, vi } from 'vitest';
import { KinisiSession } from './kinisi_session';
import { GET_IMU_MOUNT, SET_IMU_MOUNT } from './kinisi_commands';

const identity = { board_model:1, board_major:0, board_minor:4, board_patch:0, protocol_major:2, protocol_minor:23 };
function session() {
  const board = new KinisiSession();
  board.ready = true;
  board.boardInfo = { ...identity };
  board._sendRequest = vi.fn();
  return board;
}

describe('shared physical IMU mount', () => {
  it('accepts a zero unconfigured board pose and rejects any nonzero angle or offset', async () => {
    const board = session();
    board.boardInfo = {...identity, protocol_minor:24};
    const padded = new Uint8Array(21).fill(255);
    const reply = padded.subarray(1,20);
    reply.fill(0);
    board._sendRequest.mockResolvedValue(reply);
    expect(await board.get_board_mount_geometry()).toEqual({
      roll_deg:0, pitch_deg:0, yaw_deg:0, x_m:0, y_m:0, z_m:0, configured:false,
    });
    for (const index of [0, 2, 4, 6, 10, 14]) {
      reply[index] = 1;
      await expect(board.get_board_mount()).rejects.toThrow(/unconfigured board pose/);
      reply[index] = 0;
    }
  });
  it('uses distinct board-center commands and retains the 2.23 chip interface', async () => {
    const board = session();
    await expect(board.get_board_mount()).rejects.toThrow(/2.24/);
    await expect(board.set_board_mount_geometry(0,0,0,0,0,0)).rejects.toThrow(/2.24/);
    expect(board._sendRequest).not.toHaveBeenCalled();
    board.boardInfo = {...identity, protocol_minor:24};
    expect(board.supportsBoardMounting()).toBe(true);
    board._sendRequest.mockResolvedValue(new ArrayBuffer(0));
    await board.set_board_mount_geometry(90,-1.25,0,0,-.1,0);
    const [command, payload] = board._sendRequest.mock.calls[0];
    expect(command).toBe(0x85);
    expect([...new Uint8Array(payload)]).toEqual([40,35,131,255,0,0,0,0,0,0,96,121,254,255,0,0,0,0]);
    await board.set_imu_mount_geometry(90,-1.25,0,0,-.1,0);
    expect(board._sendRequest.mock.calls[1][0]).toBe(0x6e);
    const reply = new Uint8Array(19);
    reply.set(new Uint8Array(payload));
    reply[18] = 1;
    const view = new DataView(reply.buffer);
    view.setInt32(14,-10031098,true);
    board._sendRequest.mockResolvedValue(reply);
    for (const [read, code] of [[() => board.get_board_mount_geometry(),0x86], [() => board.get_imu_mount_geometry(),0x6f]]) {
      const result = await read();
      expect(result).toEqual({roll_deg:90,pitch_deg:-1.25,yaw_deg:0,x_m:0,y_m:-.1,z_m:-10.031098,configured:true});
      expect(board._sendRequest.mock.lastCall[0]).toBe(code);
    }
    view.setInt32(14,-10031099,true);
    await expect(board.get_board_mount()).rejects.toThrow(/z_um/);
    await expect(board.get_imu_mount()).rejects.toThrow(/z_um/);
    view.setInt32(14,0,true);
    reply[18] = 2;
    await expect(board.get_board_mount()).rejects.toThrow(/flag/);
    const count = board._sendRequest.mock.calls.length;
    await expect(board.set_board_mount_geometry(0,0,0,0,0,10.000001)).rejects.toThrow();
    await expect(board.set_board_mount(0,0,0,0,0,10000001)).rejects.toThrow();
    for (const override of [{protocol_minor:23},{board_patch:1},{board_model:2},{protocol_major:3}]) {
      board.boardInfo = {...identity, protocol_minor:24, ...override};
      expect(board.supportsBoardMounting()).toBe(false);
      await expect(board.get_board_mount()).rejects.toThrow();
    }
    expect(board._sendRequest).toHaveBeenCalledTimes(count);
  });
  it('quantizes signed metric input, sends one atomic request and decodes wire readback', async () => {
    const board = session();
    board._sendRequest.mockResolvedValue(new ArrayBuffer(0));
    await board.set_imu_mount_geometry(-.125, .125, 180, -.0000005, .0000005, -10);
    const [command, bytes] = board._sendRequest.mock.calls[0];
    expect(command).toBe(SET_IMU_MOUNT);
    expect(Array.from(new Uint8Array(bytes))).toEqual([243,255,13,0,80,70,255,255,255,255,1,0,0,0,128,105,103,255]);
    expect(board._sendRequest).toHaveBeenCalledTimes(1);
    const response = new Uint8Array(19);
    response.set(new Uint8Array(bytes)); response[18] = 1;
    board._sendRequest.mockResolvedValue(response);
    expect(await board.get_imu_mount_geometry()).toEqual({ roll_deg:-.13, pitch_deg:.13, yaw_deg:180,
      x_m:-.000001, y_m:.000001, z_m:-10, configured:true });
    expect(board._sendRequest.mock.calls[1][0]).toBe(GET_IMU_MOUNT);
    response[18] = 3;
    await expect(board.get_imu_mount()).rejects.toThrow(/flag/);
    response[18] = 0; new DataView(response.buffer).setInt16(2,9001,true);
    await expect(board.get_imu_mount()).rejects.toThrow(/pitch/);
  });
  it('rejects coercion, out-of-range and fractional wire values before I/O', async () => {
    const board = session();
    for (const v of [NaN, Infinity, true, '1', 180.00001]) {
      await expect(board.set_imu_mount_geometry(v,0,0,0,0,0)).rejects.toThrow();
    }
    for (const values of [[0,9001,0,0,0,0],[-18001,0,0,0,0,0],[0,0,0,.5,0,0],[0,0,0,0,-10000001,0]]) {
      await expect(board.set_imu_mount(...values)).rejects.toThrow();
    }
    expect(board._sendRequest).not.toHaveBeenCalled();
  });
  it('gates reads and writes on READY, exact v0.4.0 profile and protocol 2.23+', async () => {
    const board = session();
    for (const override of [{protocol_minor:22},{protocol_major:3},{board_minor:3},{board_patch:1},{board_model:2}]) {
      board.boardInfo = {...identity,...override};
      expect(board.supportsImuMounting()).toBe(false);
      await expect(board.get_imu_mount()).rejects.toThrow();
      await expect(board.set_imu_mount(0,0,0,0,0,0)).rejects.toThrow();
    }
    board.boardInfo = {...identity, protocol_minor:24};
    expect(board.supportsImuMounting()).toBe(true);
    board.ready = false;
    await expect(board.get_imu_mount_geometry()).rejects.toThrow();
    expect(board._sendRequest).not.toHaveBeenCalled();
  });
});
