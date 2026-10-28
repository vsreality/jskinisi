import MotorTab from './MotorTab';
import SettingsProvider from '../../contexts/SettingsProvider';
import { ControllerContext } from '../../contexts/ControllerContext';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import MotorCurrentLimit from './MotorCurrentLimit';

const boardInfo = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 11 };
it('populates board options, applies numeric milliamps, and does not initialize or restart the motor', async () => {
  const c = { boardInfo, initialize_motor: vi.fn(), set_motor_speed: vi.fn(),
    get_motor_current_limit: vi.fn().mockResolvedValue({ enabled: true, threshold_ma: 6500 }),
    set_motor_current_limit: vi.fn().mockResolvedValue({ enabled: true, threshold_ma: 5400 }) };
  const view = render(<MotorCurrentLimit controller={c} motorIndex={2} />);
  expect(screen.queryByText('Apply current limit')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Read setting'));
  await waitFor(() => expect(screen.getByLabelText('Applied motor 2 current limit')).toHaveTextContent('6500 mA'));
  expect(screen.getAllByRole('option').map(o => o.value)).toEqual(['4000', '5400', '6500', '7000']);
  fireEvent.change(screen.getByLabelText('Current threshold'), { target: { value: '5400' } });
  fireEvent.click(screen.getByText('Apply current limit'));
  await waitFor(() => expect(c.set_motor_current_limit).toHaveBeenCalledWith(2, true, 5400));
  await waitFor(() => expect(screen.getByText('Current limit applied. Motor remains stopped.')).toBeInTheDocument());
  expect(c.initialize_motor).not.toHaveBeenCalled(); expect(c.set_motor_speed).not.toHaveBeenCalled();
  c.set_motor_current_limit.mockRejectedValue(new Error('SPI verification failed'));
  fireEvent.click(screen.getByText('Apply current limit'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('SPI verification failed'));
  expect(screen.getByLabelText('Applied motor 2 current limit')).toHaveTextContent('No verified setting');
  expect(screen.queryByText('Apply current limit')).not.toBeInTheDocument();
  view.rerender(<MotorCurrentLimit controller={c} motorIndex={1} />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('hides absent hardware and gates controls on older firmware', () => {
  const view = render(<MotorCurrentLimit controller={{ boardInfo: { ...boardInfo, board_minor: 3 } }} />);
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  view.rerender(<MotorCurrentLimit controller={{ boardInfo: { ...boardInfo, protocol_minor: 10 } }} />);
  expect(screen.getByText('Update the board firmware to configure current limits.')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('preserves a selected current limit when applying speed and invalidates it on explicit reinitialization', async () => {
  const c = { boardInfo, initialize_motor: vi.fn().mockResolvedValue(), set_motor_speed: vi.fn().mockResolvedValue(),
    get_motor_current_limit: vi.fn().mockResolvedValue({ enabled: true, threshold_ma: 6500 }),
    set_motor_current_limit: vi.fn().mockResolvedValue({ enabled: true, threshold_ma: 5400 }) };
  render(<SettingsProvider><ControllerContext.Provider value={{ controller: c, isConnected: true }}><MotorTab /></ControllerContext.Provider></SettingsProvider>);
  fireEvent.click(screen.getByText('Set motor Speed'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Initialize the motor'));
  expect(c.set_motor_speed).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Initialize Motor'));
  await waitFor(() => expect(screen.getByText('Motor initialized')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Read setting'));
  await waitFor(() => expect(screen.getByLabelText('Applied motor 0 current limit')).toHaveTextContent('6500 mA'));
  fireEvent.change(screen.getByLabelText('Current threshold'), { target: { value: '5400' } });
  fireEvent.click(screen.getByText('Apply current limit'));
  await waitFor(() => expect(screen.getByLabelText('Applied motor 0 current limit')).toHaveTextContent('5400 mA'));
  fireEvent.change(screen.getByRole('slider'), { target: { value: '25' } });
  fireEvent.click(screen.getByText('Set motor Speed'));
  await waitFor(() => expect(c.set_motor_speed).toHaveBeenCalledWith('0', '25'));
  expect(c.initialize_motor).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Applied motor 0 current limit')).toHaveTextContent('5400 mA');
  fireEvent.click(screen.getByText('Initialize Motor'));
  await waitFor(() => expect(c.initialize_motor).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText('Applied motor 0 current limit')).toHaveTextContent('No verified setting');
});
