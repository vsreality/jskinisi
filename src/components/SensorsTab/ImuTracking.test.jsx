import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImuTracking from './ImuTracking';
const info={board_model:1,board_major:0,board_minor:4,board_patch:0,protocol_major:2,protocol_minor:20};
function client(){return {boardInfo:{...info},ready:true,
 get_imu_tracking_configuration:vi.fn(async()=>({mounting_yaw_rad:Math.PI,window_us:5000000})),
 get_imu_tracking_status:vi.fn(async()=>({state:2,fault:0,flags:3,reserved:0,sequence:42,timestamp_us:2n**60n+7n,elapsed_us:500,accel_age_us:10,gyro_age_us:20})),
 get_imu_tracking_vector:vi.fn(async kind=>({sequence:kind===2?43:42,x:1,y:2,z:3})),set_imu_tracking:vi.fn(async()=>{})};}
const click=name=>fireEvent.click(screen.getByRole('button',{name}));
function confirm(){fireEvent.change(screen.getByLabelText(/Sensor \+X angle/),{target:{value:String(Math.PI)}});fireEvent.click(screen.getByRole('checkbox',{name:/I confirm/}));}
describe('IMU tracking panel',()=>{
 it('reads without starting, exposes timing and rejects combining snapshots',async()=>{
  const c=client();render(<ImuTracking controller={c} isConnected/>);await screen.findByText(/Sequence 42/);
  expect(screen.getByText(/Sequence 42/)).toHaveTextContent(String(2n**60n+7n));expect(screen.getByText(/Different snapshot/)).toHaveTextContent('1 m/s², 2 m/s², 3 rad/s');
  expect(screen.getByText(/Different snapshot/)).toHaveTextContent('not associated with displayed status or timestamp');
  expect(c.set_imu_tracking).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Start tracking'})).toBeDisabled();
  confirm();click('Start tracking');await waitFor(()=>expect(c.set_imu_tracking).toHaveBeenCalledExactlyOnceWith(0,1,Math.PI));
  expect(screen.getByRole('checkbox',{name:/I confirm/})).not.toBeChecked();
 });
 it('clears prior success on failure and never retries actions automatically',async()=>{
  const c=client();render(<ImuTracking controller={c} isConnected/>);await screen.findByText(/Sequence 42/);
  c.set_imu_tracking.mockRejectedValueOnce(new Error('INVALID_ARGUMENT'));click('Stop tracking');
  expect(await screen.findByRole('alert')).toHaveTextContent('Action is not confirmed');expect(screen.queryByText(/Sequence 42/)).not.toBeInTheDocument();
  expect(c.set_imu_tracking).toHaveBeenCalledExactlyOnceWith(1,0,0);click('Read tracking diagnostics');await screen.findByText(/Sequence 42/);expect(c.set_imu_tracking).toHaveBeenCalledTimes(1);
 });
 it('fences old reconnect replies and never reapplies a declaration',async()=>{
  const c=client();let finish;c.get_imu_tracking_configuration.mockImplementationOnce(()=>new Promise(r=>{finish=r;}));
  const view=render(<ImuTracking controller={c} isConnected/>);view.rerender(<ImuTracking controller={c} isConnected={false}/>);c.boardInfo={...info};view.rerender(<ImuTracking controller={c} isConnected/>);
  await screen.findByText(/Sequence 42/);await act(async()=>finish({mounting_yaw_rad:0,window_us:999}));expect(screen.getByText(/500 \/ 5000000/)).toBeInTheDocument();expect(c.set_imu_tracking).not.toHaveBeenCalled();
 });
 it('marks cached or hidden snapshots and polls only diagnostics',async()=>{
  const c=client();const view=render(<ImuTracking controller={c} isConnected/>);await screen.findByText(/Sequence 42/);
  vi.useFakeTimers();fireEvent.click(screen.getByRole('checkbox',{name:/Refresh diagnostics/}));await act(async()=>vi.advanceTimersByTimeAsync(500));expect(c.get_imu_tracking_status).toHaveBeenCalledTimes(2);expect(c.set_imu_tracking).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox',{name:/Refresh diagnostics/}));await act(async()=>vi.advanceTimersByTimeAsync(2000));expect(screen.getByText(/Cached snapshot/)).toBeInTheDocument();
  view.rerender(<ImuTracking controller={c} isConnected isActive={false}/>);await act(async()=>vi.advanceTimersByTimeAsync(1000));expect(c.get_imu_tracking_status).toHaveBeenCalledTimes(2);vi.useRealTimers();
 });
 it('shows rounded independent observations while samples advance during delayed reads',async()=>{
  const c=client();let sequence=42;
  c.get_imu_tracking_vector.mockImplementation(async()=>{await new Promise(r=>setTimeout(r,15));return {sequence:++sequence,x:.007260000000000001,y:.06600000000000002,z:.123456789};});
  render(<ImuTracking controller={c} isConnected/>);await screen.findByText(/Sequence 42/);
  expect(screen.getAllByText(/Different snapshot/)).toHaveLength(3);
  expect(screen.getByText(/POSE:/)).toHaveTextContent('0.00726 m, 0.066 m, 0.12346 rad');
  expect(screen.queryByText(/matches tracking snapshot/)).not.toBeInTheDocument();
 });
 it('performs no I/O for unsupported firmware',()=>{const c=client();c.boardInfo.protocol_minor=19;render(<ImuTracking controller={c} isConnected/>);expect(c.get_imu_tracking_status).not.toHaveBeenCalled();expect(screen.queryByRole('button')).not.toBeInTheDocument();});
 it('keeps the action ACK when the following read fails',async()=>{
  const c=client();render(<ImuTracking controller={c} isConnected/>);await screen.findByText(/Sequence 42/);
  c.get_imu_tracking_status.mockRejectedValueOnce(new Error('transport timeout'));
  confirm();click('Reset relative origin');
  expect(await screen.findByRole('alert')).toHaveTextContent('Action acknowledged.');
  click('Read tracking diagnostics');await screen.findByText(/Sequence 42/);
  expect(c.set_imu_tracking).toHaveBeenCalledExactlyOnceWith(2,1,Math.PI);
 });
 it.each([[1600,500],[15,4990000]])('ages the requested status while vector reads are pending',async(delay,elapsed)=>{
  let clock=100, release;
  const time=vi.spyOn(performance,'now').mockImplementation(()=>clock);
  try {
   const c=client();
   c.get_imu_tracking_status.mockResolvedValue({state:2,fault:0,flags:3,sequence:42,timestamp_us:500n,elapsed_us:elapsed});
   c.get_imu_tracking_vector.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
   render(<ImuTracking controller={c} isConnected/>);
   await waitFor(()=>expect(release).toBeTypeOf('function'));
   clock+=delay;
   await act(async()=>release({sequence:42,x:0,y:0,z:0}));
   expect(screen.getByText(/Cached snapshot/)).toBeInTheDocument();
   expect(screen.queryByText(/Tracking snapshot available/)).not.toBeInTheDocument();
  } finally {time.mockRestore();}
 });
});
