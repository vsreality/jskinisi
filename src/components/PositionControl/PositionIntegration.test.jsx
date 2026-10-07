import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import SettingsProvider from '../../contexts/SettingsProvider';
import Settings from '../Settings/Settings';
import { ControllerContext } from '../../contexts/ControllerContext';
import PlatformTab from '../PlatfirmTab/PlatfirmTab';
import MotorControllerTab from '../MotorControllerTab/MotorControllerTab';

vi.mock('../MotorControllerTab/MotorControllerChart', () => ({
  default: ({ ref, speedUnit }) => { ref.current = { resetChart: vi.fn() }; return <output aria-label="Velocity graph units">{speedUnit}</output>; },
}));
vi.mock('react-chartjs-2', () => ({ Line: () => null }));
const click = name => fireEvent.click(screen.getByRole('button', { name, exact: true }));
const initializeButton = () => screen.getByRole('button', { name: 'Initialize position controller' });
const targetButton = () => screen.getByRole('button', { name: 'Set position', exact: true });
beforeEach(() => localStorage.clear());
function renderTab(Tab, controller) {
  controller.boardInfo ??= { protocol_major: 2, protocol_minor: 3 };
  render(<SettingsProvider><Settings /><ControllerContext.Provider value={{ controller, isConnected: true }}><Tab /></ControllerContext.Provider></SettingsProvider>);
}

describe('position control integration', () => {
  it.each([['motor', MotorControllerTab], ['platform', PlatformTab]])('uses direct PID starting gains and explains disabled integral action on %s', async (kind, Tab) => {
    const c = { boardInfo: { protocol_major: 2, protocol_minor: 3, protocol_patch: 1 },
      initialize_motor_controller: vi.fn().mockResolvedValue(),
      initialize_omni_platform: vi.fn().mockResolvedValue(),
      start_platform_controller: vi.fn().mockResolvedValue(),
      get_motor_controller_state: vi.fn().mockResolvedValue({ output: 0 }) };
    renderTab(Tab, c);
    expect(screen.getByLabelText('Velocity Kp')).toHaveValue(kind === 'motor' ? '1' : 1);
    expect(screen.getByLabelText('Velocity Ki')).toHaveValue(kind === 'motor' ? '1' : 1);
    if (kind === 'platform') {
      click('Initialize');
      await waitFor(() => expect(c.initialize_omni_platform).toHaveBeenCalled());
    }
    click('Initialize velocity controller');
    await waitFor(() => expect(initializeButton()).toBeEnabled());
    const call = kind === 'motor' ? c.initialize_motor_controller.mock.calls[0].slice(5)
      : c.start_platform_controller.mock.calls[0];
    expect(call).toEqual(['1', '1', '0', '100']);
    fireEvent.change(screen.getByLabelText('Velocity Ki'), { target: { value: '0' } });
    expect(screen.getByText(/Ki is zero: output will not build up/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Velocity Ki'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Integral contribution limit (% PWM)'), { target: { value: '0' } });
    expect(screen.getByText(/Integral limit is zero: integral action is disabled/)).toBeInTheDocument();
    // Editing does not apply gains or start the motor automatically.
    expect((kind === 'motor' ? c.initialize_motor_controller : c.start_platform_controller)).toHaveBeenCalledTimes(1);
  });
  it('shares settings units across motor targets and graphs without reinitializing controllers', async () => {
    const c = {
      initialize_motor_controller: vi.fn().mockResolvedValue(),
      initialize_motor_position_pid_controller: vi.fn().mockResolvedValue(),
      set_motor_target_speed: vi.fn().mockResolvedValue(),
      set_motor_position: vi.fn().mockResolvedValue(),
      get_motor_controller_state: vi.fn().mockResolvedValue({ output: 0 }),
    };
    renderTab(MotorControllerTab, c);
    expect(screen.getAllByLabelText('Angle units')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Angle units'), { target: { value: 'deg' } });
    click('Initialize velocity controller');
    await waitFor(() => expect(initializeButton()).toBeEnabled());
    expect(screen.getByLabelText('Maximum speed (deg/s)').valueAsNumber).toBeCloseTo(180 / Math.PI);
    fireEvent.change(screen.getByRole('slider'), { target: { value: String(180 / Math.PI) } });
    click('Set velocity target');
    await waitFor(() => expect(c.set_motor_target_speed).toHaveBeenCalled());
    expect(c.set_motor_target_speed.mock.calls[0][1]).toBeCloseTo(1);
    fireEvent.change(screen.getByLabelText('Maximum speed (deg/s)'), { target: { value: '180' } });
    click('Initialize position controller');
    await waitFor(() => expect(targetButton()).toBeEnabled());
    expect(c.initialize_motor_position_pid_controller.mock.calls[0][2]).toBeCloseTo(Math.PI);
    fireEvent.change(screen.getByLabelText('Target position (deg)'), { target: { value: '720' } });
    click('Set position');
    await screen.findByText('Position target accepted.');
    expect(c.set_motor_position).toHaveBeenCalledWith(0, 4 * Math.PI);
    fireEvent.change(screen.getByLabelText('Angle units'), { target: { value: 'rad' } });
    expect(screen.getByLabelText('Target position (rad)').valueAsNumber).toBeCloseTo(4 * Math.PI);
    expect(screen.getByRole('slider').valueAsNumber).toBeCloseTo(1);
    expect(screen.getByLabelText('Velocity graph units')).toHaveTextContent('rad');
    expect(targetButton()).toBeEnabled();
    expect(c.initialize_motor_controller).toHaveBeenCalledTimes(1);
    expect(c.initialize_motor_position_pid_controller).toHaveBeenCalledTimes(1);
    expect(c.set_motor_position).toHaveBeenCalledTimes(1);
    expect(c.set_motor_target_speed).toHaveBeenCalledTimes(1);
  });
  it('gates motor setup on velocity ACK and invalidates position on stop', async () => {
    const c = { initialize_motor_controller: vi.fn().mockResolvedValue(),
      initialize_motor_position_pid_controller: vi.fn().mockResolvedValue(),
      get_motor_controller_state: vi.fn().mockResolvedValue({ output: 0 }),
      delete_motor_controller: vi.fn().mockResolvedValue() };
    renderTab(MotorControllerTab, c);
    expect(initializeButton()).toBeDisabled();
    click('Initialize velocity controller');
    await waitFor(() => expect(initializeButton()).toBeEnabled());
    click('Initialize position controller');
    await waitFor(() => expect(targetButton()).toBeEnabled());
    click('Stop motor controller');
    await waitFor(() => expect(initializeButton()).toBeDisabled());
    expect(targetButton()).toBeDisabled();
    expect(c.delete_motor_controller).toHaveBeenCalledWith('0');
  });

  it('invalidates platform pose control on velocity override and stop', async () => {
    const c = { initialize_omni_platform: vi.fn().mockResolvedValue(),
      start_platform_controller: vi.fn().mockResolvedValue(),
      initialize_platform_position_pid_controller: vi.fn().mockResolvedValue(),
      set_platform_target_velocity: vi.fn().mockResolvedValue(),
      stop_platform_controller: vi.fn().mockResolvedValue() };
    renderTab(PlatformTab, c);
    expect(initializeButton()).toBeDisabled();
    click('Initialize');
    await waitFor(() => expect(c.initialize_omni_platform).toHaveBeenCalled());
    click('Initialize velocity controller');
    await waitFor(() => expect(initializeButton()).toBeEnabled());
    click('Initialize position controller');
    await waitFor(() => expect(targetButton()).toBeEnabled());
    click('Set Platform Velocity Target');
    await waitFor(() => expect(targetButton()).toBeDisabled());
    expect(initializeButton()).toBeEnabled();
    click('Stop Platform Controller');
    await waitFor(() => expect(initializeButton()).toBeDisabled());
  });
});
