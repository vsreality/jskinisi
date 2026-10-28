import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import MotorFaults from './MotorFaults';
import { Topic } from '../../commands/kinisi_commands';

const boardInfo = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 9 };
it('shows fault causes, distinguishes unavailable diagnostics, and cleans up streams', async () => {
  let callback;
  const unsubscribe = vi.fn().mockResolvedValue();
  const controller = { boardInfo, initialize_motor: vi.fn(), set_motor_speed: vi.fn(),
    get_motor_faults: vi.fn().mockResolvedValue({ status_valid: true, overcurrent: true }),
    subscribe: vi.fn(async (options, fn) => { callback = fn; return { active: true, unsubscribe }; }) };
  const view = render(<MotorFaults controller={controller} motorIndex={2} />);
  fireEvent.click(screen.getByRole('button', { name: 'Read faults' }));
  await waitFor(() => expect(screen.getByLabelText('Latest motor 2 faults')).toHaveTextContent('Overcurrent'));
  expect(controller.get_motor_faults).toHaveBeenCalledWith(2);
  fireEvent.click(screen.getByRole('button', { name: 'Start live updates' }));
  await waitFor(() => expect(controller.subscribe).toHaveBeenCalledWith(
    { topic: Topic.MOTOR_FAULTS, index: 2, intervalMs: 100, mode: 1 }, expect.any(Function)));
  act(() => callback({ status_valid: false, sleep_requested: false }));
  expect(screen.getByLabelText('Latest motor 2 faults')).toHaveTextContent('missing motor power');
  expect(screen.queryByText('No reported faults')).not.toBeInTheDocument();
  act(() => callback({ status_valid: false, sleep_requested: true }));
  expect(screen.getByLabelText('Latest motor 2 faults')).toHaveTextContent('Driver asleep');
  view.rerender(<MotorFaults controller={controller} motorIndex={2} isActive={false} />);
  await waitFor(() => expect(unsubscribe).toHaveBeenCalledOnce());
  act(() => callback({ status_valid: true }));
  expect(screen.getByLabelText('Latest motor 2 faults')).toHaveTextContent('Driver asleep');
  expect(controller.initialize_motor).not.toHaveBeenCalled(); expect(controller.set_motor_speed).not.toHaveBeenCalled();
});

it('hides absent hardware and offers a firmware update for older protocols', () => {
  const view = render(<MotorFaults controller={{ boardInfo: { ...boardInfo, board_minor: 3 } }} />);
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  view.rerender(<MotorFaults controller={{ boardInfo: { ...boardInfo, protocol_minor: 7 } }} />);
  const section = screen.getByRole('region', { name: 'Motor 0 faults' });
  expect(within(section).getByText('Update the board firmware to read motor faults.')).toBeInTheDocument();
  expect(within(section).queryByRole('button')).not.toBeInTheDocument();
});


it('keeps a quiet change subscription listening and offers periodic mode', async () => {
  vi.useFakeTimers();
  try {
    let callback;
    const controller = { boardInfo, subscribe: vi.fn(async (options, fn) => {
      callback = fn; return { active: true, unsubscribe: vi.fn().mockResolvedValue() };
    }) };
    const view = render(<MotorFaults controller={controller} />);
    expect(screen.getByLabelText('Delivery mode')).toHaveValue('1');
    expect(screen.getByLabelText('Check interval (ms)')).toHaveValue(100);
    await act(async () => { fireEvent.click(screen.getByText('Start live updates')); });
    act(() => callback({ status_valid: true }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(screen.getByLabelText('Live update status')).toHaveTextContent('Listening for changes');
    expect(screen.queryByText('No recent samples')).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByText('Stop live updates')); });
    fireEvent.change(screen.getByLabelText('Delivery mode'), { target: { value: '0' } });
    expect(screen.getByLabelText('Update interval (ms)')).toHaveValue(100);
    view.unmount();
  } finally { vi.useRealTimers(); }
});

it('uses periodic fault updates on protocol 2.8', async () => {
  const controller = { boardInfo: { ...boardInfo, protocol_minor: 8 },
    subscribe: vi.fn().mockResolvedValue({ active: true, unsubscribe: vi.fn().mockResolvedValue() }) };
  const view = render(<MotorFaults controller={controller} />);
  expect(screen.queryByLabelText('Delivery mode')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Start live updates'));
  await waitFor(() => expect(controller.subscribe).toHaveBeenCalledWith(
    { topic: Topic.MOTOR_FAULTS, index: 0, intervalMs: 100, mode: 0 }, expect.any(Function)));
  view.unmount();
});


it('clears the selected motor and preserves an active fault returned by firmware', async () => {
  const controller = { boardInfo: { ...boardInfo, protocol_minor: 10 },
    clear_motor_faults: vi.fn().mockResolvedValue({ status_valid: true, fault_active: true, overcurrent: true }),
    initialize_motor: vi.fn(), set_motor_speed: vi.fn() };
  render(<MotorFaults controller={controller} motorIndex={3} />);
  fireEvent.click(screen.getByText('Clear faults'));
  await waitFor(() => expect(controller.clear_motor_faults).toHaveBeenCalledExactlyOnceWith(3));
  await waitFor(() => expect(screen.getByLabelText('Latest motor 3 faults')).toHaveTextContent('Overcurrent'));
  expect(controller.initialize_motor).not.toHaveBeenCalled(); expect(controller.set_motor_speed).not.toHaveBeenCalled();
  controller.clear_motor_faults.mockRejectedValue(new Error('Driver verification failed'));
  fireEvent.click(screen.getByText('Clear faults'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Driver verification failed'));
});

it('does not let telemetry replace a pending clear or enable a duplicate request', async () => {
  let callback, complete;
  const controller = { boardInfo: { ...boardInfo, protocol_minor: 10 },
    clear_motor_faults: vi.fn(() => new Promise(resolve => { complete = resolve; })),
    subscribe: vi.fn(async (options, fn) => { callback = fn; return { active: true, unsubscribe: vi.fn().mockResolvedValue() }; }) };
  render(<MotorFaults controller={controller} motorIndex={1} />);
  fireEvent.click(screen.getByText('Start live updates'));
  await waitFor(() => expect(controller.subscribe).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Clear faults'));
  act(() => callback({ status_valid: true, overcurrent: true }));
  expect(screen.getByText('Clearing…')).toBeDisabled();
  expect(screen.getByText('Read faults')).toBeDisabled();
  await act(async () => { complete({ status_valid: true }); });
  expect(screen.getByLabelText('Latest motor 1 faults')).toHaveTextContent('No reported faults');
  expect(screen.getByText('Clear faults')).toBeEnabled();
});

it('does not offer clear on firmware that only supports fault reads', () => {
  render(<MotorFaults controller={{ boardInfo }} />);
  expect(screen.queryByRole('button', { name: 'Clear faults' })).not.toBeInTheDocument();
  expect(screen.getByText('Update the board firmware to clear faults separately.')).toBeInTheDocument();
});

it('shows new-session telemetry while a previous connection fault read is unfinished', async () => {
  let finishOldRead, callback;
  const controller = {
    boardInfo: { ...boardInfo },
    get_motor_faults: vi.fn(() => new Promise(resolve => { finishOldRead = resolve; })),
    subscribe: vi.fn(async (_options, fn) => { callback = fn; return { active: true, unsubscribe: vi.fn().mockResolvedValue() }; }),
  };
  const view = render(<MotorFaults controller={controller} />);
  fireEvent.click(screen.getByText('Read faults'));
  expect(screen.getByText('Reading…')).toBeDisabled();
  controller.boardInfo = { ...boardInfo };
  view.rerender(<MotorFaults controller={controller} />);
  fireEvent.click(screen.getByText('Start live updates'));
  await waitFor(() => expect(controller.subscribe).toHaveBeenCalled());
  act(() => callback({ status_valid: true, overcurrent: true }));
  expect(screen.getByLabelText('Latest motor 0 faults')).toHaveTextContent('Overcurrent');
  await act(async () => finishOldRead({ status_valid: true }));
  expect(screen.getByLabelText('Latest motor 0 faults')).toHaveTextContent('Overcurrent');
});
