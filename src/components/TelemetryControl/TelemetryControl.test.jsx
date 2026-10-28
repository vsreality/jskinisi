import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TelemetryControl from './TelemetryControl';
import BoardTemperature from '../SensorsTab/BoardTemperature';
import BoardImu from '../SensorsTab/BoardImu';
import { Topic } from '../../commands/kinisi_commands';

function controller() {
  const handle = { active: true, unsubscribe: vi.fn().mockResolvedValue() };
  return {
    boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 6 },
    subscribe: vi.fn().mockResolvedValue(handle), handle,
    get_temperature: vi.fn(), get_imu: vi.fn(),
  };
}
const start = () => fireEvent.click(screen.getByRole('button', { name: 'Start live updates' }));
afterEach(() => vi.useRealTimers());

describe('Live telemetry controls', () => {
  it('starts on request, shows samples and unsubscribes when stopped', async () => {
    const c = controller();
    render(<BoardTemperature controller={c} />);
    expect(c.subscribe).not.toHaveBeenCalled();
    start();
    await waitFor(() => expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Waiting'));
    expect(c.subscribe).toHaveBeenCalledWith({ topic: Topic.TEMPERATURE, index: 0, intervalMs: 1000, mode: 0 }, expect.any(Function));
    act(() => c.subscribe.mock.calls[0][1]({ celsius: -12.5 }));
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('-12.50 °C');
    expect(c.get_temperature).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop live updates' }));
    await waitFor(() => expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Updates stopped'));
    expect(c.handle.unsubscribe).toHaveBeenCalledOnce();
  });
  it('updates IMU axes and releases the stream when the tab is hidden', async () => {
    const c = controller();
    const view = render(<BoardImu controller={c} />);
    start();
    await waitFor(() => expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Waiting'));
    expect(c.subscribe.mock.calls[0][0]).toEqual({ topic: Topic.IMU, index: 0, intervalMs: 100, mode: 0 });
    act(() => c.subscribe.mock.calls[0][1]({ acceleration_x: 1, acceleration_y: 2, acceleration_z: 3,
      angular_velocity_x: 4, angular_velocity_y: 5, angular_velocity_z: 6 }));
    expect(screen.getByLabelText('Angular velocity Z')).toHaveTextContent('6.000');
    view.rerender(<BoardImu controller={c} isActive={false} />);
    expect(c.handle.unsubscribe).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Stop live updates' })).toBeNull();
  });
  it('keeps the live status when the first sample arrives before the handle resolves', async () => {
    const c = controller();
    c.subscribe.mockImplementation(async (_options, onSample) => {
      onSample({ celsius: 24 });
      return c.handle;
    });
    render(<BoardTemperature controller={c} />);
    start();
    await waitFor(() => expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Live'));
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('24.00');
  });
  it('cleans up a delayed subscription ACK after unmount and ignores its samples', async () => {
    const c = controller(), onSample = vi.fn();
    let finish;
    c.subscribe.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<TelemetryControl controller={c} topic={Topic.IMU} onSample={onSample} />);
    start(); view.unmount();
    await act(async () => { finish(c.handle); });
    c.subscribe.mock.calls[0][1]({ value: 3 });
    expect(c.handle.unsubscribe).toHaveBeenCalledOnce(); expect(onSample).not.toHaveBeenCalled();
  });
  it('cleans up when the selected encoder or controller changes', async () => {
    const c = controller(), onSample = vi.fn();
    const view = render(<TelemetryControl controller={c} topic={Topic.ENCODER_ODOMETRY} index={0} onSample={onSample} />);
    start(); await waitFor(() => expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Waiting'));
    const oldCallback = c.subscribe.mock.calls[0][1];
    view.rerender(<TelemetryControl controller={c} topic={Topic.ENCODER_ODOMETRY} index={1} onSample={onSample} />);
    expect(c.handle.unsubscribe).toHaveBeenCalledOnce();
    oldCallback({ angle: 1 }); expect(onSample).not.toHaveBeenCalled();
    const next = controller();
    view.rerender(<TelemetryControl controller={next} topic={Topic.ENCODER_ODOMETRY} index={1} onSample={onSample} />);
    expect(next.subscribe).not.toHaveBeenCalled();
    start(); await waitFor(() => expect(next.subscribe).toHaveBeenCalled());
    expect(next.subscribe.mock.calls[0][0].index).toBe(1);
  });
  it('keeps manual reads available and hides live controls on older firmware', () => {
    const c = controller(); c.boardInfo.protocol_minor = 5;
    render(<BoardImu controller={c} />);
    expect(screen.getByRole('button', { name: 'Read IMU' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Start live updates' })).toBeNull();
  });
  it('shows rejected subscription errors and allows retry', async () => {
    const c = controller();
    c.subscribe.mockRejectedValueOnce(new Error('Start odometry first'));
    render(<TelemetryControl controller={c} topic={Topic.PLATFORM_ODOMETRY} onSample={vi.fn()} />);
    start();
    expect(await screen.findByRole('alert')).toHaveTextContent('Start odometry first');
    start(); await waitFor(() => expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Waiting'));
  });
  it('marks stale data without adding read requests and detects a cleared session', async () => {
    vi.useFakeTimers();
    const c = controller();
    render(<TelemetryControl controller={c} topic={Topic.IMU} onSample={vi.fn()} />);
    start(); await act(async () => {});
    await act(async () => { vi.advanceTimersByTime(1600); });
    expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('No recent samples');
    act(() => c.subscribe.mock.calls[0][1]({ acceleration_x: 1 }));
    expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Live');
    await act(async () => { vi.advanceTimersByTime(1600); });
    expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('No recent samples');
    c.handle.active = false;
    await act(async () => { vi.advanceTimersByTime(1600); });
    expect(screen.getByRole('status', { name: 'Live update status' })).toHaveTextContent('Updates ended');
    expect(c.get_imu).not.toHaveBeenCalled();
  });
});

it('exposes independent trigger, delivery, and maximum-silence settings', async () => {
  const c = controller(); c.boardInfo.protocol_minor = 12;
  render(<TelemetryControl controller={c} topic={Topic.MOTOR_FAULTS} trigger={1} mode={1} maxSilenceMs={5000} onSample={vi.fn()} />);
  expect(screen.getByLabelText('Trigger')).toHaveValue('1');
  expect(screen.getByLabelText('Delivery mode')).toHaveValue('1');
  expect(screen.queryByLabelText('Polling interval (ms)')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Maximum silence (ms; 0 disables)')).toHaveValue(5000);
  start();
  await waitFor(() => expect(c.subscribe).toHaveBeenCalledWith({ topic: Topic.MOTOR_FAULTS, index: 0, trigger: 1, delivery: 1, pollIntervalMs: 0, maxSilenceMs: 5000 }, expect.any(Function)));
  expect(screen.getByLabelText('Trigger')).toBeDisabled();
});
