import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DriverSleep from './DriverSleep';
import BoardPowerProvider from '../../contexts/BoardPowerProvider';
import TelemetryControl from '../TelemetryControl/TelemetryControl';
import { ErrorCode, Topic, SubscriptionMode, SubscriptionTrigger } from '../../commands/kinisi_commands';

afterEach(() => vi.useRealTimers());
const info = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 16 };
const boards = [info, ...[0, 1].map(board_patch => ({ ...info, board_minor: 3, board_patch, protocol_minor: 18 }))];
function client(boardInfo = info) {
  const c = { boardInfo: { ...boardInfo }, ready: true, idle: 0, sleeping: 0,
    get_board_idle: vi.fn(async () => c.idle), get_driver_sleep: vi.fn(async () => c.sleeping),
    set_board_idle: vi.fn(async value => { c.idle = value; }), set_driver_sleep: vi.fn(),
    handle: { active: true, unsubscribe: vi.fn().mockResolvedValue(), refresh: vi.fn().mockResolvedValue() },
    subscribe: vi.fn(async () => c.handle) };
  return c;
}
const click = name => fireEvent.click(screen.getByRole('button', { name }));
const idleState = () => screen.getByLabelText('Board idle state');

it.each(boards)('waits for ACK/readback and preserves prior inhibit on board wake: %j', async board => {
  const c = client(board); c.sleeping = 1;
  render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Active — board idle cleared');
  expect(c.set_board_idle).not.toHaveBeenCalled();
  let complete;
  c.set_board_idle.mockImplementationOnce(value => new Promise(resolve => { complete = () => { c.idle = value; resolve(); }; }));
  click('Enter board idle');
  expect(idleState()).toHaveTextContent('Changing');
  expect(screen.getByRole('button', { name: 'Wake board' })).toBeDisabled();
  expect(c.get_board_idle).toHaveBeenCalledTimes(1);
  await act(async () => complete());
  await screen.findByText('Idle — automatic telemetry paused');
  expect(screen.getByRole('button', { name: 'Wake drivers' })).toBeDisabled();
  click('Wake board');
  await screen.findByText('Active — board idle cleared');
  expect(screen.getByLabelText('Driver sleep state')).toHaveTextContent(board.board_minor === 3 ? 'Inhibited' : 'Asleep');
  expect(c.set_driver_sleep).not.toHaveBeenCalled();
  expect(c.set_board_idle.mock.calls).toEqual([[1], [0]]);
});

it.each(boards)('offers explicit retry without unverified success: %j', async board => {
  const c = client(board);
  render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Active — board idle cleared');
  c.set_board_idle.mockRejectedValueOnce({ code: ErrorCode.INTERNAL_ERROR });
  click('Enter board idle');
  await screen.findByRole('alert');
  expect(idleState()).toHaveTextContent('State not verified');
  expect(screen.getByRole('alert')).toHaveTextContent('idle and motion inhibition remain active');
  expect(screen.getByRole('alert')).toHaveTextContent(board.board_minor === 3 ? 'motor power and wiring' : 'driver faults');
  click('Enter board idle');
  await screen.findByText('Idle — automatic telemetry paused');
  c.set_board_idle.mockRejectedValueOnce(new Error('Timed out'));
  click('Wake board');
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not confirmed'));
  click('Read board state');
  await screen.findByText('Idle — automatic telemetry paused');
  expect(c.set_board_idle).toHaveBeenCalledTimes(3);
  click('Wake board');
  await screen.findByText('Active — board idle cleared');
});

it.each(boards)('reads idle after reconnect and ignores an old reply: %j', async board => {
  const c = client(board); let finish;
  c.get_board_idle.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<DriverSleep controller={c} isConnected />);
  view.rerender(<DriverSleep controller={c} isConnected={false} />);
  c.boardInfo = { ...board }; c.idle = 1; c.sleeping = 1;
  view.rerender(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Idle — automatic telemetry paused');
  await act(async () => finish(0));
  expect(idleState()).toHaveTextContent('Idle');
  expect(c.set_board_idle).not.toHaveBeenCalled();
});

it.each(boards)('uses one poll and preserves fresh telemetry across external idle/wake: %j', async board => {
  const c = client(board), onSample = vi.fn();
  const content = active => <BoardPowerProvider controller={c} isConnected isActive={active}>
    <DriverSleep controller={c} isConnected />
    <TelemetryControl controller={c} topic={Topic.ENCODER_ODOMETRY} mode={SubscriptionMode.ON_CHANGE} onSample={onSample} />
  </BoardPowerProvider>;
  const view = render(content(true));
  await screen.findByText('Active — board idle cleared');
  expect(c.get_board_idle).toHaveBeenCalledTimes(1);
  expect(c.get_driver_sleep).toHaveBeenCalledTimes(1);
  click('Start live updates');
  await screen.findByRole('button', { name: 'Stop live updates' });
  const sample = c.subscribe.mock.calls[0][1];
  act(() => sample({ angle: 22 }));
  expect(screen.getByLabelText('Live update status')).toHaveTextContent('Listening for changes');
  vi.useFakeTimers();
  view.rerender(content(false)); view.rerender(content(true));
  await act(async () => {});
  const before = c.get_board_idle.mock.calls.length;
  c.idle = 1; c.sleeping = 1;
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(c.get_board_idle).toHaveBeenCalledTimes(before + 1);
  expect(screen.getByLabelText('Live update status')).toHaveTextContent('Paused by board idle');
  expect(c.handle.unsubscribe).not.toHaveBeenCalled();
  act(() => sample({ angle: 99 }));
  expect(onSample).toHaveBeenCalledTimes(1);
  c.idle = 0; c.sleeping = 0;
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(screen.getByLabelText('Live update status')).toHaveTextContent('Waiting for fresh samples');
  act(() => sample({ angle: 23 }));
  expect(screen.getByLabelText('Live update status')).toHaveTextContent('Listening for changes');
  expect(c.subscribe).toHaveBeenCalledTimes(1);
  expect(c.handle.refresh).toHaveBeenCalledTimes(1);
  expect(c.set_board_idle).not.toHaveBeenCalled();
  expect(c.set_driver_sleep).not.toHaveBeenCalled();
});

it.each([0, 1])('explains input-low board idle and keeps 2.17 driver-only for v0.3.%s', async board_patch => {
  const c = client({ ...info, board_minor: 3, board_patch, protocol_minor: 17 });
  const view = render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Inhibit cleared — fresh drive or brake allowed');
  expect(c.get_board_idle).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Enter board idle' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sleep drivers' })).toBeEnabled();
  c.boardInfo = { ...c.boardInfo, protocol_minor: 18 };
  view.rerender(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Active — board idle cleared');
  expect(screen.getByText(/Idle stops motion, inhibits motor commands/)).toHaveTextContent('keeps the USB session connected');
  expect(screen.getByText(/Wake board preserves a motor inhibit/)).toHaveTextContent('fresh drive or explicit short brake');
  expect(screen.queryByText(/Otherwise it verifies the drivers/)).not.toBeInTheDocument();
  click('Read board state');
  await waitFor(() => expect(c.get_board_idle).toHaveBeenCalledTimes(2));
  expect(c.set_board_idle).not.toHaveBeenCalled();
  expect(c.set_driver_sleep).not.toHaveBeenCalled();
});

it.each([
  [SubscriptionTrigger.PERIODIC, false], [SubscriptionTrigger.ON_EVENT, false],
  [SubscriptionTrigger.PERIODIC, true], [SubscriptionTrigger.ON_EVENT, true],
])('rearms unchanged quiet streams after an early wake event, trigger %s, manual %s', async (trigger, manual) => {
  const c = client(), onSample = vi.fn();
  render(<BoardPowerProvider controller={c} isConnected>
    <DriverSleep controller={c} isConnected />
    <TelemetryControl controller={c} topic={Topic.MOTOR_FAULTS} trigger={trigger}
      mode={SubscriptionMode.ON_CHANGE} maxSilenceMs={0} onSample={onSample} />
  </BoardPowerProvider>);
  await screen.findByText('Active — board idle cleared');
  click('Start live updates');
  await screen.findByRole('button', { name: 'Stop live updates' });
  const sample = c.subscribe.mock.calls[0][1];
  act(() => sample({ fault: false }));
  expect(c.handle.refresh).not.toHaveBeenCalled();
  c.handle.refresh.mockImplementation(async () => sample({ fault: false }));
  // External entry followed by external wake: its sole fresh event arrives
  // before our GET_BOARD_IDLE response. It cannot be treated as verified yet.
  c.idle = 1; click('Read board state');
  await screen.findByText('Idle — automatic telemetry paused');
  expect(c.handle.refresh).not.toHaveBeenCalled();
  let finish;
  c.get_board_idle.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  c.idle = 0; click(manual ? 'Wake board' : 'Read board state');
  await act(async () => {});
  act(() => sample({ fault: false }));
  expect(onSample).toHaveBeenCalledTimes(1);
  await act(async () => finish(0));
  await waitFor(() => expect(c.handle.refresh).toHaveBeenCalledTimes(1));
  expect(onSample).toHaveBeenCalledTimes(2);
  expect(screen.getByLabelText('Live update status')).toHaveTextContent('Listening for changes');
  click('Read board state');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Read board state' })).toBeEnabled());
  expect(c.handle.refresh).toHaveBeenCalledTimes(1);
  expect(c.subscribe).toHaveBeenCalledTimes(1);
  expect(c.handle.unsubscribe).not.toHaveBeenCalled();
  expect(c.set_board_idle).toHaveBeenCalledTimes(manual ? 1 : 0);
});

it('rearms on verified recovery and redundant wake without making cached samples live', async () => {
  const c = client(), onSample = vi.fn();
  render(<BoardPowerProvider controller={c} isConnected>
    <DriverSleep controller={c} isConnected />
    <TelemetryControl controller={c} topic={Topic.TEMPERATURE} mode={SubscriptionMode.ON_CHANGE} onSample={onSample} />
  </BoardPowerProvider>);
  await screen.findByText('Active — board idle cleared');
  click('Start live updates');
  await screen.findByRole('button', { name: 'Stop live updates' });
  const sample = c.subscribe.mock.calls[0][1];
  act(() => sample({ celsius: 22 }));
  c.get_board_idle.mockRejectedValueOnce(new Error('Temporary read failure'));
  click('Read board state');
  await waitFor(() => expect(idleState()).toHaveTextContent('State not verified'));
  act(() => sample({ celsius: 99 }));
  expect(onSample).toHaveBeenCalledTimes(1);
  click('Read board state');
  await waitFor(() => expect(c.handle.refresh).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText('Live update status')).toHaveTextContent('Waiting for fresh samples');
  act(() => sample({ celsius: 22 }));
  c.handle.refresh.mockImplementation(async () => sample({ celsius: 22 }));
  click('Wake board');
  await waitFor(() => expect(c.handle.refresh).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText('Live update status')).toHaveTextContent('Listening for changes');
  expect(onSample).toHaveBeenCalledTimes(3);
  expect(c.subscribe).toHaveBeenCalledTimes(1);
  expect(c.handle.unsubscribe).not.toHaveBeenCalled();
});

it('disables new subscriptions until board state is known and awake', async () => {
  const c = client(); c.idle = 1;
  render(<BoardPowerProvider controller={c} isConnected>
    <DriverSleep controller={c} isConnected />
    <TelemetryControl controller={c} topic={Topic.TEMPERATURE} onSample={vi.fn()} />
  </BoardPowerProvider>);
  expect(screen.getByRole('button', { name: 'Start live updates' })).toBeDisabled();
  await screen.findByText('Idle — automatic telemetry paused');
  expect(screen.getByRole('button', { name: 'Start live updates' })).toBeDisabled();
  expect(c.subscribe).not.toHaveBeenCalled();
});
