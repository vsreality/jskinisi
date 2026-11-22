import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DriverSleep from './DriverSleep';
import MotorTab from './MotorTab';
import SettingsProvider from '../../contexts/SettingsProvider';
import { ControllerContext } from '../../contexts/ControllerContext';
import { ErrorCode } from '../../commands/kinisi_commands';

vi.mock('./MotorCurrent', () => ({ default: () => null }));
vi.mock('./MotorFaults', () => ({ default: () => null }));
vi.mock('./MotorCurrentLimit', () => ({ default: () => null }));
vi.mock('./FaultHistory', () => ({ default: () => null }));
afterEach(() => vi.useRealTimers());
const boardInfo = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 15 };
const client = () => ({ boardInfo: { ...boardInfo }, ready: true,
  get_driver_sleep: vi.fn().mockResolvedValue(0), set_driver_sleep: vi.fn().mockResolvedValue() });
const click = name => fireEvent.click(screen.getByRole('button', { name }));
const state = () => screen.getByLabelText('Driver sleep state');

it('reads without changing state and verifies explicit sleep and wake after their ACK', async () => {
  const c = client();
  render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Awake — board-wide inhibit cleared');
  expect(c.set_driver_sleep).not.toHaveBeenCalled();
  let acknowledge;
  c.set_driver_sleep.mockImplementationOnce(() => new Promise(resolve => { acknowledge = resolve; }));
  c.get_driver_sleep.mockResolvedValue(1);
  click('Sleep drivers');
  expect(screen.getByRole('button', { name: 'Wake drivers' })).toBeDisabled();
  expect(c.get_driver_sleep).toHaveBeenCalledTimes(1);
  await act(async () => acknowledge());
  await screen.findByText('Asleep — motor commands inhibited');
  expect(c.set_driver_sleep).toHaveBeenCalledExactlyOnceWith(1);
  c.get_driver_sleep.mockResolvedValue(0);
  click('Wake drivers');
  await screen.findByText('Awake — board-wide inhibit cleared');
  expect(c.set_driver_sleep).toHaveBeenLastCalledWith(0);
  expect(screen.getByText(/leaves outputs stopped/)).toBeInTheDocument();
});

it('observes external changes while active and pauses polling off tab', async () => {
  const c = client();
  const view = render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Awake — board-wide inhibit cleared');
  vi.useFakeTimers();
  // Restart the active effect under the fake clock.
  view.rerender(<DriverSleep controller={c} isConnected isActive={false} />);
  view.rerender(<DriverSleep controller={c} isConnected />);
  await act(async () => {});
  c.get_driver_sleep.mockResolvedValue(1);
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(state()).toHaveTextContent('Asleep');
  expect(c.set_driver_sleep).not.toHaveBeenCalled();
  view.rerender(<DriverSleep controller={c} isConnected isActive={false} />);
  const count = c.get_driver_sleep.mock.calls.length;
  await act(async () => vi.advanceTimersByTimeAsync(4000));
  expect(c.get_driver_sleep).toHaveBeenCalledTimes(count);
});

it('discards an old connection response and reads the new session without waking', async () => {
  const c = client(); let complete;
  c.get_driver_sleep.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const view = render(<DriverSleep controller={c} isConnected />);
  view.rerender(<DriverSleep controller={c} isConnected={false} />);
  c.boardInfo = { ...boardInfo }; c.get_driver_sleep.mockResolvedValue(1);
  view.rerender(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Asleep — motor commands inhibited');
  await act(async () => complete(0));
  expect(state()).toHaveTextContent('Asleep');
  expect(c.set_driver_sleep).not.toHaveBeenCalled();
});

it('reports failed wake, timeout and mismatched readback without claiming success', async () => {
  const c = client(); c.get_driver_sleep.mockResolvedValue(1);
  render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Asleep — motor commands inhibited');
  c.set_driver_sleep.mockRejectedValueOnce({ code: ErrorCode.INTERNAL_ERROR });
  click('Wake drivers');
  await screen.findByRole('alert');
  expect(screen.getByRole('alert')).toHaveTextContent('Wake failed; the drivers remain inhibited');
  expect(state()).toHaveTextContent('State not verified');
  c.set_driver_sleep.mockRejectedValueOnce(new Error('Timed out'));
  click('Wake drivers');
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('state is not confirmed'));
  click('Read driver state');
  await screen.findByText('Asleep — motor commands inhibited');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  click('Wake drivers');
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('readback differs'));
  expect(state()).toHaveTextContent('Asleep');
});

it('clears verified state on a failed read and permits manual recovery', async () => {
  const c = client();
  render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Awake — board-wide inhibit cleared');
  c.get_driver_sleep.mockRejectedValueOnce(new Error('Disconnected'));
  click('Read driver state');
  await screen.findByRole('alert');
  expect(state()).toHaveTextContent('State not verified');
  click('Read driver state');
  await screen.findByText('Awake — board-wide inhibit cleared');
});

it.each([{ protocol_minor: 14 }, { board_minor: 3 }, { board_patch: 1 }, { board_model: 2 }])('gates unsupported capability %j', async override => {
  const c = client(); c.boardInfo = { ...boardInfo, ...override };
  render(<DriverSleep controller={c} isConnected />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(c.get_driver_sleep).not.toHaveBeenCalled();
});

it('keeps board-wide control available without initializing individually owned motors', async () => {
  const c = client(); c.initialize_motor = vi.fn();
  render(<SettingsProvider><ControllerContext.Provider value={{ controller: c, isConnected: true }}><MotorTab /></ControllerContext.Provider></SettingsProvider>);
  await screen.findByText('Awake — board-wide inhibit cleared');
  expect(screen.getByRole('button', { name: 'Sleep drivers' })).toBeEnabled();
  expect(c.initialize_motor).not.toHaveBeenCalled();
});

it.each([0, 1])('shows truthful DRV8870 inhibit, explicit release and reconnect for v0.3.%s', async board_patch => {
  const c = client();
  c.boardInfo = { ...boardInfo, board_minor: 3, board_patch, protocol_minor: 17 };
  c.get_board_idle = vi.fn(); c.set_board_idle = vi.fn();
  const view = render(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Inhibit cleared — fresh drive or brake allowed');
  expect(screen.getByText(/both inputs stay low until a fresh drive or explicit short-brake request/)).toHaveTextContent('Short brake drives both inputs high; coast returns them low');
  expect(screen.getByText(/no sleep-state readback/)).toHaveTextContent('1.5 ms');
  expect(screen.getByText(/no sleep-state readback/)).toHaveTextContent('5 μs');
  expect(screen.getByText(/no sleep-state readback/)).toHaveTextContent('50 μs');
  expect(screen.queryByText(/Wake checks the retained driver settings/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Wake board' })).not.toBeInTheDocument();
  expect(c.get_board_idle).not.toHaveBeenCalled();
  c.get_driver_sleep.mockResolvedValue(1);
  click('Sleep drivers');
  await screen.findByText('Inhibited — motor commands blocked');
  expect(c.set_driver_sleep).toHaveBeenCalledExactlyOnceWith(1);
  view.rerender(<DriverSleep controller={c} isConnected={false} />);
  c.boardInfo = { ...c.boardInfo };
  view.rerender(<DriverSleep controller={c} isConnected />);
  await screen.findByText('Inhibited — motor commands blocked');
  expect(c.set_driver_sleep).toHaveBeenCalledTimes(1);
  c.set_driver_sleep.mockRejectedValueOnce(new Error('Timed out'));
  click('Wake drivers');
  await waitFor(() => expect(state()).toHaveTextContent('State not verified'));
  expect(screen.getByRole('alert')).toHaveTextContent('state is not confirmed');
  c.get_driver_sleep.mockResolvedValue(0);
  click('Wake drivers');
  await screen.findByText('Inhibit cleared — fresh drive or brake allowed');
  expect(c.set_driver_sleep.mock.calls).toEqual([[1], [0], [0]]);
  expect(c.set_board_idle).not.toHaveBeenCalled();
  // A second transport can inhibit without any implicit local wake.
  c.get_driver_sleep.mockResolvedValue(1);
  click('Read driver state');
  await screen.findByText('Inhibited — motor commands blocked');
  expect(c.set_driver_sleep).toHaveBeenCalledTimes(3);
});

it.each([
  { board_minor: 3, board_patch: 0, protocol_minor: 16 },
  { board_minor: 3, board_patch: 1, protocol_minor: 16 },
  { board_minor: 2, protocol_minor: 17 },
  { board_minor: 3, board_patch: 2, protocol_minor: 17 },
  { board_minor: 3, board_model: 2, protocol_minor: 17 },
])('does not expose legacy sleep for an unsupported revision or firmware %j', override => {
  const c = client(); c.boardInfo = { ...boardInfo, ...override };
  render(<DriverSleep controller={c} isConnected />);
  expect(screen.queryByRole('button', { name: 'Sleep drivers' })).not.toBeInTheDocument();
  expect(c.get_driver_sleep).not.toHaveBeenCalled();
});
