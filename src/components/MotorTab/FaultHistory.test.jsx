import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import FaultHistory from './FaultHistory';
import MotorFaults from './MotorFaults';
import MotorTab from './MotorTab';
import Connection from '../Connection/Connection';
import TabContainer from '../Tabs/TabContainer';
import { ControllerContext } from '../../contexts/ControllerContext';
import SettingsProvider from '../../contexts/SettingsProvider';
import FaultHistoryProvider from '../../contexts/FaultHistoryProvider';
import { Topic } from '../../commands/kinisi_commands';
import { FAULT_HISTORY_LIMIT, faultHistoryReducer, initialFaultHistory } from '../../contexts/faultHistory';
import { motorFaultSnapshot } from './motorFaultStatus';

const boardInfo = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 11 };
const healthy = { status_valid: true };
const warning = { status_valid: true, overtemperature_warning: true };
const shutdown = { status_valid: true, fault_active: true, overtemperature_shutdown: true };

function controllerForHistory() {
  const callbacks = new Map();
  return {
    boardInfo: { ...boardInfo }, callbacks,
    get_motor_faults: vi.fn().mockResolvedValue(warning),
    clear_motor_faults: vi.fn().mockResolvedValue(healthy),
    initialize_motor: vi.fn(), set_motor_speed: vi.fn(), stop_motor: vi.fn(),
    subscribe: vi.fn(async (options, callback) => {
      callbacks.set(`${options.topic}:${options.index}`, callback);
      return { active: true, unsubscribe: vi.fn().mockResolvedValue() };
    }),
  };
}
function shell(controller, isConnected = true) {
  return <SettingsProvider><ControllerContext.Provider value={{ controller, isConnected }}>
    <FaultHistoryProvider><TabContainer>
      <Connection title="Connection" alwaysEnabled />
      <MotorTab title="Motor" />
      <div title="Other">Another section</div>
    </TabContainer></FaultHistoryProvider>
  </ControllerContext.Provider></SettingsProvider>;
}
const log = () => within(screen.getByRole('region', { name: 'Fault history' }));
const records = () => log().queryAllByRole('row').slice(1);
const faults = index => within(screen.getByRole('region', { name: `Motor ${index} faults` }));

it('records thermal warnings and recovery, but not duplicate samples or timestamp changes', async () => {
  const controller = controllerForHistory();
  render(shell(controller));
  expect(log().getByText(/No history yet/)).toBeVisible();
  expect(log().getByRole('button', { name: 'Clear history' })).toBeDisabled();
  fireEvent.click(faults(0).getByText('Start live updates'));
  await waitFor(() => expect(controller.callbacks.has(`${Topic.MOTOR_FAULTS}:0`)).toBe(true));
  const callback = controller.callbacks.get(`${Topic.MOTOR_FAULTS}:0`);
  act(() => callback({ ...warning, timestamp_us: 10n }));
  act(() => callback({ ...warning, timestamp_us: 20n }));
  expect(records()).toHaveLength(1);
  // A warning is recorded even when the driver's global fault flag is clear.
  expect(records()[0]).toHaveTextContent('Temperature warning');
  expect(records()[0]).toHaveTextContent('Live update');
  expect(records()[0].querySelector('time').dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  fireEvent.click(faults(0).getByText('Read faults'));
  await waitFor(() => expect(faults(0).getByText('Read faults')).toBeEnabled());
  expect(records()).toHaveLength(1);
  act(() => callback(shutdown));
  act(() => callback(healthy));
  expect(records()).toHaveLength(3);
  expect(records()[0]).toHaveTextContent('No reported faults');
  expect(records()[1]).toHaveTextContent('Thermal shutdown');
  expect(records()[2]).toHaveTextContent('Temperature warning');
  expect(controller.initialize_motor).not.toHaveBeenCalled();
  expect(controller.set_motor_speed).not.toHaveBeenCalled();
});

it('retains history across motor changes, tab changes and disconnects, and separates a new connection', async () => {
  const controller = controllerForHistory();
  const view = render(shell(controller));
  fireEvent.click(faults(0).getByText('Read faults'));
  await waitFor(() => expect(records()).toHaveLength(1));
  fireEvent.change(screen.getByLabelText('Motor'), { target: { value: '2' } });
  fireEvent.click(faults(2).getByText('Read faults'));
  await waitFor(() => expect(records()).toHaveLength(2));
  expect(within(records()[0]).getAllByRole('cell')[2]).toHaveTextContent('2');
  fireEvent.click(screen.getByRole('button', { name: 'Other', exact: true }));
  expect(screen.queryByRole('region', { name: 'Fault history' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Motor', exact: true }));
  expect(records()).toHaveLength(2);
  view.rerender(shell(controller, false));
  expect(screen.getByRole('heading', { name: 'Connect a controller' })).toBeVisible();
  expect(records()).toHaveLength(2);
  const next = controllerForHistory();
  view.rerender(shell(next));
  fireEvent.click(faults(0).getByText('Read faults'));
  await waitFor(() => expect(records()).toHaveLength(3));
  expect(within(records()[0]).getAllByRole('cell')[1]).toHaveTextContent('2');
  expect(within(records()[2]).getAllByRole('cell')[1]).toHaveTextContent('1');
});

it('records telemetry during a pending driver clear and retains it after the fault clears', async () => {
  const controller = controllerForHistory();
  let complete;
  controller.clear_motor_faults.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  render(shell(controller));
  fireEvent.click(faults(0).getByText('Start live updates'));
  await waitFor(() => expect(controller.subscribe).toHaveBeenCalled());
  fireEvent.click(faults(0).getByText('Clear faults'));
  act(() => controller.callbacks.get(`${Topic.MOTOR_FAULTS}:0`)(shutdown));
  expect(records()[0]).toHaveTextContent('Thermal shutdown');
  expect(faults(0).getByText('Clearing…')).toBeDisabled();
  await act(async () => complete(healthy));
  expect(records()).toHaveLength(2);
  expect(records()[0]).toHaveTextContent('No reported faults');
  expect(records()[0]).toHaveTextContent('Clear faults result');
  expect(records()[1]).toHaveTextContent('Thermal shutdown');
  fireEvent.click(log().getByRole('button', { name: 'Clear history' }));
  expect(records()).toHaveLength(0);
  expect(controller.clear_motor_faults).toHaveBeenCalledTimes(1);
  expect(controller.stop_motor).not.toHaveBeenCalled();
  expect(controller.initialize_motor).not.toHaveBeenCalled();
  // Clearing history allows the next received state to establish a new baseline.
  act(() => controller.callbacks.get(`${Topic.MOTOR_FAULTS}:0`)(healthy));
  expect(records()).toHaveLength(1);
});

it('keeps unavailable or asleep states distinct from recovery, and read failures do not invent healthy records', async () => {
  const controller = controllerForHistory();
  render(shell(controller));
  for (const value of [warning, { status_valid: false }, { status_valid: false, sleep_requested: true }, healthy]) {
    controller.get_motor_faults.mockResolvedValue(value);
    fireEvent.click(faults(0).getByText('Read faults'));
    await waitFor(() => expect(faults(0).getByText('Read faults')).toBeEnabled());
  }
  expect(records()).toHaveLength(4);
  expect(records()[0]).toHaveTextContent('No reported faults');
  expect(records()[1]).toHaveTextContent('Driver asleep');
  expect(records()[2]).toHaveTextContent('Driver status unavailable');
  controller.get_motor_faults.mockRejectedValue(new Error('Link lost'));
  fireEvent.click(faults(0).getByText('Read faults'));
  await waitFor(() => expect(faults(0).getByRole('alert')).toHaveTextContent('Link lost'));
  expect(records()).toHaveLength(4);
});

it('ignores responses and telemetry from a view that has been closed', async () => {
  const controller = controllerForHistory();
  let complete;
  controller.get_motor_faults.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  render(shell(controller));
  fireEvent.click(faults(0).getByText('Start live updates'));
  await waitFor(() => expect(controller.subscribe).toHaveBeenCalled());
  fireEvent.click(faults(0).getByText('Read faults'));
  fireEvent.click(screen.getByRole('button', { name: 'Other', exact: true }));
  await act(async () => {
    controller.callbacks.get(`${Topic.MOTOR_FAULTS}:0`)(shutdown);
    complete(warning);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Motor', exact: true }));
  expect(records()).toHaveLength(0);
});

it('keeps only the latest 100 changes and compares state independently for each motor', () => {
  const connection = {};
  const sample = (motorIndex, value, receivedAt = 1) => ({
    type: 'sample', connection, motorIndex, status: motorFaultSnapshot(value), source: 'Live update', receivedAt,
  });
  let state = faultHistoryReducer(initialFaultHistory, sample(0, warning));
  state = faultHistoryReducer(state, sample(1, warning));
  expect(faultHistoryReducer(state, sample(0, warning))).toBe(state);
  for (let i = 0; i < 150; i++) state = faultHistoryReducer(state, sample(0, i % 2 ? warning : healthy, i));
  expect(state.entries).toHaveLength(FAULT_HISTORY_LIMIT);
  expect(state.entries[0].receivedAt).toBe(149);
  expect(state.entries.at(-1).receivedAt).toBe(50);
  const unavailable = motorFaultSnapshot({ status_valid: false, overcurrent: true, timestamp_us: 1n });
  expect(unavailable.overcurrent).toBe(false);
  expect(unavailable).toEqual(motorFaultSnapshot({ status_valid: false, timestamp_us: 2n }));
});

it('rejects a late response when a component is reused for another connection', async () => {
  const controller = controllerForHistory();
  let complete;
  controller.get_motor_faults.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  const content = client => <FaultHistoryProvider><MotorFaults controller={client} /><FaultHistory /></FaultHistoryProvider>;
  const view = render(content(controller));
  fireEvent.click(faults(0).getByText('Read faults'));
  view.rerender(content(controllerForHistory()));
  await act(async () => complete(shutdown));
  expect(records()).toHaveLength(0);
  expect(screen.getByLabelText('Latest motor 0 faults')).toHaveTextContent('No reading yet');
});
