import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../../commands/kinisi_commands';
import useImuMount from '../../hooks/useImuMount';
import ImuMounting from './ImuMounting';
import MountDiagram from './MountDiagram';
import ImuTracking from '../SensorsTab/ImuTracking';

const flat = { roll_cdeg:0, pitch_cdeg:0, yaw_cdeg:0, x_um:0, y_um:0, z_um:0, configured:false };
const info = { board_model:1, board_major:0, board_minor:4, board_patch:0, protocol_major:2, protocol_minor:23 };
function board() {
  const client = { ready:true, boardInfo:{...info}, value:{...flat}, supportsImuMounting:()=>true,
    get_imu_mount:vi.fn(async()=>({...client.value})), set_imu_mount:vi.fn(async(r,p,h,x,y,z)=>{
      client.value = {roll_cdeg:r,pitch_cdeg:p,yaw_cdeg:h,x_um:x,y_um:y,z_um:z,configured:true};
    }), set_imu_tracking:vi.fn(), get_imu_tracking_configuration:vi.fn(async()=>({window_us:1000000})),
    get_imu_tracking_status:vi.fn(async()=>({state:0,flags:0,sequence:0})), get_imu_tracking_vector:vi.fn(async()=>{throw new Error('unavailable');}) };
  return client;
}
const platform = {type:'differential',track:.30,diameter:.10};
function Panel({ controller }) {
  const mounting = useImuMount(controller, true);
  return <><ImuMounting model={mounting} platform={platform}/><ImuTracking controller={controller} isConnected mounting={mounting}/></>;
}
const click = name => fireEvent.click(screen.getByRole('button',{name}));
describe('mounting setup', () => {
  it.each([['differential',2,'Differential'], ['omni',3,'Omni'], ['mecanum',4,'Mecanum'], ['custom',0,'Generic chassis']])(
    'draws the %s platform layout', (type,count,label) => {
      const {container} = render(<MountDiagram values={[0,0,0,0,0,0]} platform={{...platform,type,radius:.15,width:.3,length:.4}}/>);
      expect(container.querySelectorAll('g[aria-label^="Wheel "]')).toHaveLength(count);
      expect(container.querySelector('figcaption')).toHaveTextContent(label);
    });
  it('previews drafts locally, preserves rejected edits, verifies application and blocks a changed mount at start',async () => {
    const client = board();
    const { container } = render(<Panel controller={client}/>);
    await screen.findByText(/Legacy per-mode yaw is active/);
    const before = container.querySelector('svg').innerHTML;
    fireEvent.change(screen.getByLabelText('Orientation preset'),{target:{value:'1'}});
    fireEvent.change(screen.getByLabelText('Y · Left'),{target:{value:'-0.100'}});
    expect(container.querySelector('svg').innerHTML).not.toBe(before);
    expect(client.set_imu_mount).not.toHaveBeenCalled();
    client.set_imu_mount.mockRejectedValueOnce({code:ErrorCode.SOURCE_SWITCH_UNSAFE});
    click('Apply mounting'); await screen.findByText(/100 ms of stationary encoder/);
    expect(screen.getByLabelText('Y · Left')).toHaveValue(-.1);
    click('Apply mounting'); await screen.findByText('Applied and verified on the board.');
    expect(client.set_imu_mount).toHaveBeenLastCalledWith(9000,0,0,0,-100000,0);
    expect(screen.queryByLabelText(/Sensor \+X angle/)).toBeNull();
    fireEvent.click(screen.getByLabelText(/I confirm zero velocity/));
    client.value.x_um = 1000;
    click('Start tracking');
    await screen.findByText(/Mounting changed or readback is unavailable/);
    expect(client.set_imu_tracking).not.toHaveBeenCalled();
  });
  it('discards stale connection readback and only starts deliberately with current geometry',async () => {
    const first = board(), second = board(); second.value.configured = true;
    let release;
    first.get_imu_mount.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
    const view = render(<Panel controller={first}/>); await waitFor(()=>expect(release).toBeTypeOf('function'));
    view.rerender(<Panel controller={second}/>);
    await screen.findByText(/Configured · roll/);
    await act(async()=>release({...flat}));
    expect(second.set_imu_mount).not.toHaveBeenCalled();
    expect(second.set_imu_tracking).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/I confirm zero velocity/)); click('Start tracking');
    await waitFor(()=>expect(second.set_imu_tracking).toHaveBeenCalledExactlyOnceWith(0,1,0));
  });
});
