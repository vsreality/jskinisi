import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { ControllerContext } from '../../contexts/ControllerContext';
import SettingsProvider from '../../contexts/SettingsProvider';
import { Topic, ErrorCode } from '../../commands/kinisi_commands';
import MotorTab from './MotorTab';
import SensorsTab from '../SensorsTab/SensorsTab';
import TabContainer from '../Tabs/TabContainer';

const boardInfo = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 7 };
function Connection() { return <p>Connect to a controller.</p>; }
function shell(controller, isConnected = true) {
  return <SettingsProvider><ControllerContext.Provider value={{ controller, isConnected }}>
    <TabContainer><Connection title="Connection" alwaysEnabled /><MotorTab title="Motor" /><SensorsTab title="Sensors" /></TabContainer>
  </ControllerContext.Provider></SettingsProvider>;
}

it('reads the selected motor and stops its stream on motor changes, tab changes and disconnect', async () => {
  const callbacks = new Map(), handles = [];
  const controller = {
    boardInfo, initialize_motor: vi.fn(), set_motor_speed: vi.fn(),
    get_motor_current: vi.fn().mockImplementation(async index => index + .125),
    subscribe: vi.fn(async (options, callback) => {
      callbacks.set(options.index, callback);
      const handle = { active: true, unsubscribe: vi.fn().mockResolvedValue() };
      handles.push(handle); return handle;
    })
  };
  const view = render(shell(controller));
  for (let index = 0; index < 4; index++) {
    fireEvent.change(screen.getByLabelText('Motor'), { target: { value: String(index) } });
    expect(screen.getByLabelText(`Latest motor ${index} current`)).toHaveTextContent('No reading yet');
    if (index) await waitFor(() => expect(handles[index - 1].unsubscribe).toHaveBeenCalledOnce());
    expect(screen.getAllByRole('button', { name: 'Read current' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Read current' }));
    await waitFor(() => expect(screen.getByLabelText(`Latest motor ${index} current`)).toHaveTextContent(`${index}.125 A`));
    expect(controller.get_motor_current).toHaveBeenNthCalledWith(index + 1, index);
    fireEvent.click(screen.getByRole('button', { name: 'Start live updates' }));
    await waitFor(() => expect(controller.subscribe).toHaveBeenCalledWith(
      { topic: Topic.MOTOR_CURRENT, index, intervalMs: 100, mode: 0 }, expect.any(Function)));
    act(() => callbacks.get(index)({ amps: index + .25 }));
    expect(screen.getByLabelText(`Latest motor ${index} current`)).toHaveTextContent(`${index}.250 A`);
    if (index) {
      act(() => callbacks.get(index - 1)({ amps: 9 }));
      expect(screen.getByLabelText(`Latest motor ${index} current`)).toHaveTextContent(`${index}.250 A`);
    }
  }
  fireEvent.click(screen.getByRole('button', { name: 'Sensors', exact: true }));
  await waitFor(() => expect(handles[3].unsubscribe).toHaveBeenCalledOnce());
  expect(screen.queryByRole('button', { name: 'Read current' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Read temperature' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Read IMU' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Motor', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Start live updates' }));
  await waitFor(() => expect(handles).toHaveLength(5));
  view.rerender(shell(controller, false));
  await waitFor(() => expect(handles[4].unsubscribe).toHaveBeenCalledOnce());
  expect(screen.queryByLabelText('Latest motor 3 current')).toBeNull();
  expect(controller.initialize_motor).not.toHaveBeenCalled();
  expect(controller.set_motor_speed).not.toHaveBeenCalled();
});

it('does not carry delayed reads into another motor and reports saturation', async () => {
  let resolve;
  const controller = { boardInfo, get_motor_current: vi.fn().mockImplementationOnce(() => new Promise(r => { resolve = r; })) };
  render(shell(controller));
  fireEvent.click(screen.getByRole('button', { name: 'Read current' }));
  fireEvent.change(screen.getByLabelText('Motor'), { target: { value: '1' } });
  await act(async () => resolve(4));
  expect(screen.getByLabelText('Latest motor 1 current')).toHaveTextContent('No reading yet');
  controller.get_motor_current.mockRejectedValue({ code: ErrorCode.SAMPLE_OUT_OF_RANGE });
  fireEvent.click(screen.getByRole('button', { name: 'Read current' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('saturated');
});

it('offers a firmware update hint only on boards with current sensing', () => {
  const controller = { boardInfo: { ...boardInfo, protocol_minor: 6 } };
  const view = render(shell(controller));
  expect(screen.getByText('Update the board firmware to read motor current.')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Read current' })).toBeNull();
  for (const board_minor of [1, 2, 3, 99]) {
    view.rerender(shell({ boardInfo: { ...boardInfo, board_minor } }));
    expect(screen.queryByText('Update the board firmware to read motor current.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Read current' })).toBeNull();
  }
});
