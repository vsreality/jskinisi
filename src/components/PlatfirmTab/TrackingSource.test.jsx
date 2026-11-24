import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TrackingSource from './TrackingSource';
import ConfigurationSave from './ConfigurationSave';

const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 21 };
const status = (requested = 0, valid = true, reason = 0) => ({
  requested, active: valid ? requested : 255, valid: Number(valid), reason,
  sequence: valid ? 53 : 0, timestamp_us: valid ? 2n**59n+17n : 0n,
  origin_id: 16, source_detail: 0, age_us: valid ? 12500 : 0xffffffff,
});
function board() {
  const c = { boardInfo: {...info}, ready: true, status: status(), confirmed: false,
    readFeedbackSourceSnapshot: vi.fn(async () => {
      const v = c.status.valid ? {sequence:c.status.sequence,x:0.23,y:-0.06,z:0.41} : null;
      return {status:{...c.status},pose:v,twist:v};
    }),
    set_feedback_source: vi.fn(async id => { c.status = {...status(id,false,id===2?9:1),origin_id:17}; }),
    get_feedback_fusion_mount: vi.fn(async () => ({confirmed:c.confirmed,mounting_yaw_rad:0})),
    set_feedback_fusion_mount: vi.fn(async () => { c.confirmed=true; }),
    set_fusion_experiment: vi.fn(), start_platform_odometry: vi.fn(), set_platform_target_velocity: vi.fn(),
    set_imu_tracking: vi.fn(), get_imu_tracking_configuration: vi.fn(async()=>({window_us:1000000,mounting_yaw_rad:0})),
    get_imu_tracking_status: vi.fn(async()=>({state:0,fault:0,flags:0,sequence:0,timestamp_us:0n,elapsed_us:0,accel_age_us:0xffffffff,gyro_age_us:0xffffffff})),
    get_imu_tracking_vector: vi.fn(async()=>{throw new Error('Unavailable');}),
    save_configuration: vi.fn(async()=>{}), get_pwm_frequency: vi.fn(async()=>25000),
    get_configuration_field: vi.fn(async field => [1,0.1,0.3,0,4096,0,0][field]),
  };
  return c;
}
const select = value => fireEvent.change(screen.getByLabelText('Tracking preference'), {target:{value:String(value)}});
const click = name => fireEvent.click(screen.getByRole('button',{name}));
const reading = name => screen.getByText(name,{selector:'dt'}).nextElementSibling.textContent;
afterEach(() => vi.useRealTimers());

describe('board tracking source', () => {
  it('opens with readback only, preserves timestamp precision and reports both frames',async()=>{
    const c=board();
    render(<TrackingSource controller={c} isConnected />);
    await screen.findByText('Relative pose');
    expect(reading('Source timestamp')).toBe(`${2n**59n+17n} µs`);
    expect(reading('Sample age at read')).toBe('12500 µs');
    expect(screen.getByText('Current chassis axes')).toBeVisible();
    expect(c.set_feedback_source).not.toHaveBeenCalled();
    expect(c.set_imu_tracking).not.toHaveBeenCalled();
    expect(c.set_fusion_experiment).not.toHaveBeenCalled();
    expect(c.save_configuration).not.toHaveBeenCalled();
    expect(screen.getByRole('button',{name:'Apply source'})).toBeDisabled();
  });
  it('routes IMU telemetry only on Apply and cold-starts only with a separate explicit declaration',async()=>{
    const c=board();render(<TrackingSource controller={c} isConnected />);
    await screen.findByText('Relative pose');select(1);
    expect(c.set_feedback_source).not.toHaveBeenCalled();
    click('Apply source');
    await screen.findByText('not started');
    expect(c.set_feedback_source).toHaveBeenCalledExactlyOnceWith(1);
    expect(reading('Active at board read')).toBe('None');
    expect(screen.queryByText('Relative pose')).toBeNull();
    click('IMU tracking controls');
    expect(await screen.findByRole('button',{name:'Start tracking'})).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Sensor \+X angle/),{target:{value:'0'}});
    fireEvent.click(screen.getByRole('checkbox',{name:/I confirm zero velocity/}));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Start tracking'})).toBeEnabled());
    expect(c.set_imu_tracking).not.toHaveBeenCalled();
    click('Start tracking');
    await waitFor(()=>expect(c.set_imu_tracking).toHaveBeenCalledExactlyOnceWith(0,1,0));
    c.status=status(1,true);
    click('Read board status');await screen.findByText('Relative pose');
    c.status=status(1,false,5);
    click('Read board status');await screen.findByText('expired');
    expect(reading('Validity at board read')).toBe('Unavailable');
    expect(reading('Sample age at read')).toBe('Unavailable');
    expect(screen.queryByText('Relative pose')).toBeNull();
    expect(c.set_imu_tracking).toHaveBeenCalledTimes(1);
    expect(c.set_platform_target_velocity).not.toHaveBeenCalled();
  });
  it('requires a mounting angle and confirmation before setting the passive fused mount',async()=>{
    const c=board();render(<TrackingSource controller={c} isConnected />);
    await screen.findByText('Relative pose');select(2);click('Apply source');
    await screen.findByText('mount required');
    expect(c.set_feedback_fusion_mount).not.toHaveBeenCalled();
    expect(screen.getByRole('button',{name:'Confirm fused mount'})).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Sensor \+X angle/),{target:{value:'0'}});
    fireEvent.click(screen.getByRole('checkbox',{name:/rigid, level, centered/}));
    click('Confirm fused mount');
    await screen.findByText(/confirmed at 0 rad/);
    expect(c.set_feedback_fusion_mount).toHaveBeenCalledExactlyOnceWith(0);
    expect(c.set_fusion_experiment).not.toHaveBeenCalled();
    expect(c.start_platform_odometry).not.toHaveBeenCalled();
    expect(c.set_platform_target_velocity).not.toHaveBeenCalled();
  });
  it('clears vectors on an unsafe rejection and reads actual status before a manual retry',async()=>{
    const c=board();render(<TrackingSource controller={c} isConnected />);
    await screen.findByText('Relative pose');
    c.set_feedback_source.mockRejectedValueOnce(new Error('INVALID_ARGUMENT'));
    select(2);click('Apply source');await screen.findByRole('alert');
    expect(screen.queryByText('Relative pose')).toBeNull();
    click('Read board status');await screen.findByText('Relative pose');
    expect(reading('Requested')).toBe('Encoders');
    expect(c.set_feedback_source).toHaveBeenCalledTimes(1);
  });
  it('ignores previous-session replies and draft selection on reconnect',async()=>{
    const c=board();let finish;
    const view=render(<TrackingSource controller={c} isConnected />);
    await screen.findByText('Relative pose');select(2);
    c.readFeedbackSourceSnapshot.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    click('Read board status');
    view.rerender(<TrackingSource controller={c} isConnected={false} />);
    c.boardInfo={...info}; c.status=status(1,false,5);
    view.rerender(<TrackingSource controller={c} isConnected />);
    await screen.findByText('expired');
    await act(async()=>finish({status:status(),pose:null,twist:null}));
    expect(reading('Requested')).toBe('IMU only');
    expect(screen.getByLabelText('Tracking preference')).toHaveValue('');
    expect(c.set_feedback_source).not.toHaveBeenCalled();
  });
  it('withholds stale vectors while a board read is delayed',async()=>{
    const c=board();vi.useFakeTimers();
    render(<TrackingSource controller={c} isConnected />);
    await act(async()=>{});
    expect(screen.getByText('Relative pose')).toBeVisible();
    c.readFeedbackSourceSnapshot.mockImplementation(()=>new Promise(()=>{}));
    await act(async()=>vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByText(/Historical readback/)).toBeVisible();
    expect(screen.queryByText('Relative pose')).toBeNull();
  });
  it('uses the existing explicit whole-configuration save',async()=>{
    const c=board();
    render(<><TrackingSource controller={c} isConnected /><ConfigurationSave controller={c} isConnected onBusy={()=>{}} onLoaded={()=>{}} /></>);
    await screen.findByText(/Running differential setup loaded/);
    const saveRegion=screen.getByRole('region',{name:'Save setup on the board'});
    expect(screen.getByRole('link',{name:'save the running board configuration'})).toHaveAttribute('href','#configurationSaveTitle');
    expect(c.save_configuration).not.toHaveBeenCalled();
    fireEvent.click(within(saveRegion).getByRole('button',{name:'Save configuration'}));
    await screen.findByText(/saved and verified by the board/);
    expect(c.save_configuration).toHaveBeenCalledTimes(1);
    expect(c.set_feedback_source).not.toHaveBeenCalled();
  });
  it('gates old and unknown hardware and does no selector I/O when inactive',()=>{
    const c=board();c.boardInfo.protocol_minor=20;
    const view=render(<TrackingSource controller={c} isConnected />);
    expect(screen.queryByRole('combobox')).toBeNull();
    c.boardInfo={...info,board_patch:1};view.rerender(<TrackingSource controller={c} isConnected />);
    expect(screen.queryByRole('combobox')).toBeNull();
    c.boardInfo={...info};view.rerender(<TrackingSource controller={c} isConnected isActive={false}/>);
    expect(c.readFeedbackSourceSnapshot).not.toHaveBeenCalled();
  });
});
