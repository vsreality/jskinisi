import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../../commands/kinisi_commands';
import { getBoardProfile } from '../../commands/board_profile';
import useImuMount from '../../hooks/useImuMount';
import ImuMounting from './ImuMounting';
import MountDiagram from './MountDiagram';
import ImuTracking from '../SensorsTab/ImuTracking';
import PlatformTab from './PlatfirmTab';
import SensorsTab from '../SensorsTab/SensorsTab';
import { ControllerContext } from '../../contexts/ControllerContext';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

const flat = { roll_cdeg:0, pitch_cdeg:0, yaw_cdeg:0, x_um:0, y_um:0, z_um:0, configured:false };
const info = { board_model:1, board_major:0, board_minor:4, board_patch:0, protocol_major:2, protocol_minor:24 };
function board() {
  const client = { ready:true, boardInfo:{...info}, value:{...flat}, supportsBoardMounting:()=>true, supportsImuMounting:()=>true,
    get_board_mount:vi.fn(async()=>({...client.value})), set_board_mount:vi.fn(async(r,p,h,x,y,z)=>{
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
  it.each([['Platform',PlatformTab],['Sensors',SensorsTab]])('shows legacy IMU sensor readback and retries a failed read in %s', async (tab, Tab) => {
    const client = board();
    client.boardInfo = {...info,protocol_minor:23};
    client.supportsBoardMounting = () => false;
    client.get_configuration_field = vi.fn(async () => 0);
    client.set_imu_mount = vi.fn();
    client.get_imu_mount = vi.fn().mockRejectedValueOnce(new Error('Read timed out'))
      .mockResolvedValueOnce({roll_cdeg:1234,pitch_cdeg:-4500,yaw_cdeg:0,x_um:-9000,y_um:100000,z_um:-1000,configured:true})
      .mockResolvedValueOnce(flat);
    render(<ControllerContext.Provider value={{controller:client,isConnected:true}}><Tab/></ControllerContext.Provider>);
    const readback = within(screen.getByRole('region',{name:'Legacy IMU sensor mounting'}));
    expect(await readback.findByRole('alert')).toHaveTextContent('Read timed out');
    expect(readback.getByText(/Protocol 2.23 measures the offset to the IMU sensor/)).toHaveTextContent('Upgrade to protocol 2.24');
    if (tab === 'Sensors') expect(screen.getByLabelText(/I confirm zero velocity/)).toBeDisabled();
    fireEvent.click(readback.getByRole('button',{name:'Retry mounting read'}));
    await readback.findByText('12.34 / -45 / 0°');
    expect(readback.getByText('Tracking origin to IMU sensor · X / Y / Z')).toBeVisible();
    expect(readback.getByText('-0.009 / 0.1 / -0.001 m')).toBeVisible();
    if (tab === 'Sensors') expect(screen.getByLabelText(/I confirm zero velocity/)).toBeEnabled();
    fireEvent.click(readback.getByRole('button',{name:'Read mounting'}));
    await readback.findByText(/Shared mounting is unconfigured/);
    expect(readback.queryByText('-0.009 / 0.1 / -0.001 m')).toBeNull();
    expect(screen.queryByRole('button',{name:'Apply mounting'})).toBeNull();
    expect(client.get_imu_mount).toHaveBeenCalledTimes(3);
    expect(client.get_board_mount).not.toHaveBeenCalled();
    expect(client.set_imu_mount).not.toHaveBeenCalled();
    expect(client.set_board_mount).not.toHaveBeenCalled();
  });
  it('pivots about the entered underside center and uses the profile to locate the IMU sensor', () => {
    const profile = getBoardProfile(info);
    const diagram = (roll, boardProfile=profile) => <MountDiagram boardProfile={boardProfile}
      values={[roll,0,0,0,0,0]} platform={platform}/>;
    const {container, rerender} = render(diagram(0));
    const svg = screen.getByRole('img', { name: /PCB underside center and IMU sensor.*USB-C port/ });
    expect(within(svg).getByText('USB-C port')).toBeVisible();
    expect(within(svg).getByText('IMU sensor')).toBeVisible();
    expect(container.querySelector('figcaption')).toHaveTextContent('IMU sensor');
    expect(container.querySelector('figcaption')).toHaveTextContent('USB-C port');
    const rear = () => container.querySelector('[aria-label="Rear-view geometry"]');
    const marker = root => root.querySelector('[aria-label="IMU sensor"]');
    const center = root => root.querySelector('[aria-label="PCB underside center"]').getAttribute('transform');
    const xy = mark => ['cx','cy'].map(key=>Number(mark.getAttribute(key)));
    const [chipX, chipY] = xy(marker(container));
    // With zero rotation the nominal sensor is left (+Y) and behind (−X) the origin.
    expect(chipX).toBeLessThan(147); expect(chipY).toBeGreaterThan(150);
    expect(center(container)).toBe('translate(147 150)');
    const flatRearHeight = xy(marker(rear()))[1];
    rerender(diagram(90));
    expect(center(container)).toBe('translate(147 150)');
    expect(center(rear())).toBe('translate(0 0)');
    const [sideX,sideY] = xy(marker(rear()));
    expect(sideX).toBeGreaterThan(0);
    expect(sideY/flatRearHeight).toBeCloseTo(26.953/2.075, 3);
    rerender(diagram(90,{...profile, imu_geometry:{underside_center_to_imu_um:[0,0,0]}}));
    expect(xy(marker(container))).toEqual([147,150]);
    expect(rear().querySelector('[aria-label="Tracking origin"]')).toBeInTheDocument();
    expect(center(rear())).toBe('translate(0 0)');
  });
  it('shows converted readback outside the write range and permits an in-range correction', async () => {
    const client=board();
    client.value={...flat,configured:true,x_um:10031098};
    render(<Panel controller={client}/>);
    await screen.findByText(/Converted board readback exceeds/);
    expect(screen.getByLabelText('X · Forward')).toHaveValue(10.031098);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Apply mounting'})).toBeDisabled();
    fireEvent.change(screen.getByLabelText('X · Forward'),{target:{value:'10'}});
    click('Apply mounting');
    await screen.findByText('Applied and verified on the board.');
    expect(client.set_board_mount).toHaveBeenCalledExactlyOnceWith(0,0,0,10000000,0,0);
  });
  it.each([['differential',2,'Differential'], ['omni',3,'Omni'], ['mecanum',4,'Mecanum'], ['custom',0,'Generic chassis']])(
    'draws the %s platform layout', (type,count,label) => {
      const {container} = render(<MountDiagram boardProfile={getBoardProfile(info)} values={[0,0,0,0,0,0]} platform={{...platform,type,radius:.15,width:.3,length:.4}}/>);
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
    expect(client.set_board_mount).not.toHaveBeenCalled();
    client.set_board_mount.mockRejectedValueOnce({code:ErrorCode.SOURCE_SWITCH_UNSAFE});
    click('Apply mounting'); await screen.findByText(/100 ms of stationary encoder/);
    expect(screen.getByLabelText('Y · Left')).toHaveValue(-.1);
    click('Apply mounting'); await screen.findByText('Applied and verified on the board.');
    expect(client.set_board_mount).toHaveBeenLastCalledWith(9000,0,0,0,-100000,0);
    fireEvent.change(screen.getByLabelText('Z · Up'),{target:{value:'-0.15'}});
    expect(screen.getByText(/Preview has unapplied edits/)).toBeInTheDocument();
    expect(screen.queryByText('Applied and verified on the board.')).toBeNull();
    expect(screen.queryByLabelText(/Sensor \+X angle/)).toBeNull();
    fireEvent.click(screen.getByLabelText(/I confirm zero velocity/));
    client.value.x_um = 1000;
    click('Start tracking');
    await screen.findByText(/Mounting changed or readback is unavailable/);
    expect(client.set_imu_tracking).not.toHaveBeenCalled();
  });
  it.each([-10,-.15,.15,10])('fits the chip and rotated board in the rear view with Z=%s m', z=>{
    const {container} = render(<MountDiagram boardProfile={getBoardProfile(info)} values={[83,45,-35,0,.1,z]} platform={platform}/>);
    const rear=container.querySelector('g[aria-label="Rear-view geometry"]');
    const [,ox,oy]=rear.getAttribute('transform').match(/translate\(([\d.]+) ([\d.]+)\)/).map(Number);
    const marker=rear.querySelector('[aria-label="IMU sensor"]');
    const cx=Number(marker.getAttribute('cx')),cy=Number(marker.getAttribute('cy'));
    expect(Math.sign(cy)).toBe(-Math.sign(z));
    const points=rear.querySelector('polygon').getAttribute('points').split(' ').map(point=>point.split(',').map(Number));
    for (const [x,y] of [...points,[cx-4,cy-4],[cx+4,cy+4]]) {
      expect(ox+x).toBeGreaterThan(0);expect(ox+x).toBeLessThan(294);
      expect(oy+y).toBeGreaterThan(260);expect(oy+y).toBeLessThan(332);
    }
  });
  it('discards stale connection readback and only starts deliberately with current geometry',async () => {
    const first = board(), second = board(); second.value.configured = true;
    let release;
    first.get_board_mount.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
    const view = render(<Panel controller={first}/>); await waitFor(()=>expect(release).toBeTypeOf('function'));
    view.rerender(<Panel controller={second}/>);
    await screen.findByText(/Configured · roll/);
    await act(async()=>release({...flat}));
    expect(second.set_board_mount).not.toHaveBeenCalled();
    expect(second.set_imu_tracking).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/I confirm zero velocity/)); click('Start tracking');
    await waitFor(()=>expect(second.set_imu_tracking).toHaveBeenCalledExactlyOnceWith(0,1,0));
  });
});
