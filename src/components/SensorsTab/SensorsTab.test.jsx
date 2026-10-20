import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ControllerContext } from '../../contexts/ControllerContext';
import TabContainer from '../Tabs/TabContainer';
import SensorsTab from './SensorsTab';

function Section({ children }) { return <div>{children}</div>; }

function shell(controller, connected = true) {
  return <ControllerContext.Provider value={{ controller, isConnected: connected }}>
    <TabContainer>
      <Section title="Connection" alwaysEnabled>Connection panel</Section>
      <Section title="Motor">Motor panel</Section>
      <SensorsTab title="Sensors" />
    </TabContainer>
  </ControllerContext.Provider>;
}

describe('Sensors tab', () => {
  it.each([1, 2, 3])('hides sensor controls on revision 0.%s even with current firmware', minor => {
    const controller = { boardInfo: { board_model: 1, board_major: 0, board_minor: minor, board_patch: 0,
      protocol_major: 2, protocol_minor: 5 }, get_temperature: vi.fn(), get_imu: vi.fn() };
    render(shell(controller)); fireEvent.click(screen.getByRole('button', { name: 'Sensors' }));
    expect(screen.getByText('This board has no supported sensors.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Read temperature' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Read IMU' })).toBeNull();
    expect(controller.get_temperature).not.toHaveBeenCalled(); expect(controller.get_imu).not.toHaveBeenCalled();
  });
  it('reports an unknown board without assuming sensor hardware', () => {
    const controller = { boardInfo: { board_model: 1, board_major: 0, board_minor: 99, board_patch: 0,
      protocol_major: 2, protocol_minor: 5 }, get_temperature: vi.fn(), get_imu: vi.fn() };
    render(shell(controller)); fireEvent.click(screen.getByRole('button', { name: 'Sensors' }));
    expect(screen.getByText('This board is not recognized. Update the client to view its sensors.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Read IMU' })).toBeNull();
    expect(controller.get_imu).not.toHaveBeenCalled();
  });
  it('shows the IMU alongside temperature and clears its reading on disconnect', async () => {
    const controller = { boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 5 },
      get_temperature: vi.fn(), get_imu: vi.fn().mockResolvedValue({ acceleration_x: 0, acceleration_y: 0,
        acceleration_z: 9.80665, angular_velocity_x: 0, angular_velocity_y: 0, angular_velocity_z: 0 }) };
    const view = render(shell(controller));
    fireEvent.click(screen.getByRole('button', { name: 'Sensors' }));
    expect(screen.getByRole('button', { name: 'Read temperature' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Read IMU' }));
    expect(await screen.findByLabelText('Acceleration Z')).toHaveTextContent('9.807');
    expect(controller.get_temperature).not.toHaveBeenCalled();
    view.rerender(shell(controller, false));
    expect(screen.queryByLabelText('Acceleration Z')).toBeNull();
    view.rerender(shell(controller));
    expect(screen.getByRole('button', { name: 'Read IMU' })).toBeVisible();
    expect(screen.queryByLabelText('Acceleration Z')).toBeNull();
  });
  it('reads temperature after navigating to Sensors and clears it on disconnect', async () => {
    const controller = { boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 4 },
      get_temperature: vi.fn().mockResolvedValue(25.0625) };
    const view = render(shell(controller));
    fireEvent.click(screen.getByRole('button', { name: 'Sensors' }));
    expect(screen.getByRole('heading', { name: 'Sensors' })).toBeVisible();
    expect(controller.get_temperature).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Read temperature' }));
    await waitFor(() => expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('25.06 °C'));
    expect(controller.get_temperature).toHaveBeenCalledWith(0);
    view.rerender(shell(controller, false));
    expect(screen.getByRole('button', { name: 'Sensors' })).toBeDisabled();
    expect(screen.queryByLabelText('Latest board temperature')).toBeNull();
    view.rerender(shell(controller));
    expect(screen.getByRole('heading', { name: 'Sensors' })).toBeVisible();
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('No reading yet');
  });

  it('explains older firmware without sending unsupported commands', () => {
    const controller = { boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 3 }, get_temperature: vi.fn() };
    render(shell(controller));
    fireEvent.click(screen.getByRole('button', { name: 'Sensors' }));
    expect(screen.getByText('Update the board firmware to read temperature.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Read temperature' })).toBeNull();
    expect(controller.get_temperature).not.toHaveBeenCalled();
  });
});
