import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import SettingsProvider from '../../contexts/SettingsProvider';
import { ANGLE_UNIT_STORAGE_KEY } from '../../contexts/SettingsContext';
import { ControllerContext } from '../../contexts/ControllerContext';
import Settings from './Settings';
import TabContainer from '../Tabs/TabContainer';
import MotorControllerTab from '../MotorControllerTab/MotorControllerTab';
import PlatformTab from '../PlatfirmTab/PlatfirmTab';
import MotorTab from '../MotorTab/MotorTab';

vi.mock('../MotorControllerTab/MotorControllerChart', () => ({
  default: ({ ref, speedUnit }) => { ref.current = { resetChart: vi.fn() }; return <output aria-label="Velocity graph units">{speedUnit}</output>; },
}));
vi.mock('react-chartjs-2', () => ({ Line: () => null }));
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const click = name => fireEvent.click(screen.getByRole('button', { name, exact: true }));
const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const setUnits = value => change('Angle units', value);
function renderPage(Page, controller) {
  return render(<SettingsProvider><Settings />
    <ControllerContext.Provider value={{ isConnected: true, controller }}><Page /></ControllerContext.Provider>
  </SettingsProvider>);
}

describe('global angle settings', () => {
  it('is reachable while disconnected and saves immediately across app reloads', () => {
    const first = render(<App />);
    click('Settings');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect(screen.getByLabelText('Angle units')).toHaveValue('rad');
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    setUnits('deg');
    expect(localStorage.getItem(ANGLE_UNIT_STORAGE_KEY)).toBe('deg');
    first.unmount();
    render(<App />);
    click('Settings');
    expect(screen.getByLabelText('Angle units')).toHaveValue('deg');
  });

  it('falls back on invalid saved data and continues when storage is unavailable', () => {
    localStorage.setItem(ANGLE_UNIT_STORAGE_KEY, 'invalid');
    render(<SettingsProvider><Settings /></SettingsProvider>);
    expect(screen.getByLabelText('Angle units')).toHaveValue('rad');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    setUnits('deg');
    expect(screen.getByLabelText('Angle units')).toHaveValue('deg');
    expect(screen.getByRole('alert')).toHaveTextContent('could not save');
  });

  it('loads when reading storage is blocked and synchronizes changes from another tab', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    render(<SettingsProvider><Settings /></SettingsProvider>);
    expect(screen.getByLabelText('Angle units')).toHaveValue('rad');
    read.mockRestore();
    act(() => window.dispatchEvent(new StorageEvent('storage', {
      key: ANGLE_UNIT_STORAGE_KEY, newValue: 'deg', storageArea: localStorage,
    })));
    expect(screen.getByLabelText('Angle units')).toHaveValue('deg');
  });

  it('keeps motor setup and targets when visiting Settings, without sending commands', async () => {
    const controller = {
      boardInfo: { protocol_major: 2, protocol_minor: 3, protocol_patch: 1 },
      initialize_motor_controller: vi.fn().mockResolvedValue(),
      initialize_motor_position_pid_controller: vi.fn().mockResolvedValue(),
      get_motor_controller_state: vi.fn().mockResolvedValue({}),
      set_motor_position: vi.fn(), set_motor_target_speed: vi.fn(),
    };
    render(<SettingsProvider><ControllerContext.Provider value={{ controller, isConnected: true }}>
      <TabContainer>
        <div title="Connection" alwaysEnabled />
        <MotorControllerTab title="Motor Controller" />
        <Settings title="Settings" alwaysEnabled settingsPage />
      </TabContainer>
    </ControllerContext.Provider></SettingsProvider>);
    expect(screen.queryByLabelText('Angle units')).toBeNull();
    click('Initialize velocity controller');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Initialize position controller' })).toBeEnabled());
    fireEvent.click(screen.getByLabelText('Live velocity graph'));
    click('Initialize position controller');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Set position', exact: true })).toBeEnabled());
    fireEvent.click(screen.getByLabelText('Live position graph'));
    change('Target position (rad)', String(Math.PI));
    click('Settings');
    setUnits('deg');
    click('Motor Controller');
    expect(screen.queryByLabelText('Angle units')).toBeNull();
    expect(screen.getByLabelText('Target position (deg)')).toHaveValue(180);
    expect(screen.getByLabelText('Velocity graph units')).toHaveTextContent('deg');
    expect(screen.getByRole('button', { name: 'Set position', exact: true })).toBeEnabled();
    expect(Number(screen.getByLabelText('Velocity Kp').value)).toBe(1);
    expect(controller.initialize_motor_controller).toHaveBeenCalledTimes(1);
    expect(controller.initialize_motor_position_pid_controller).toHaveBeenCalledTimes(1);
    expect(controller.set_motor_position).not.toHaveBeenCalled();
    expect(controller.set_motor_target_speed).not.toHaveBeenCalled();
  });

  it('converts platform velocity, keyboard speed and odometry while keeping gains and linear units', async () => {
    localStorage.setItem(ANGLE_UNIT_STORAGE_KEY, 'deg');
    const controller = {
      boardInfo: { protocol_major: 2, protocol_minor: 3, protocol_patch: 1 },
      initialize_omni_platform: vi.fn().mockResolvedValue(),
      start_platform_controller: vi.fn().mockResolvedValue(),
      set_platform_target_velocity: vi.fn().mockResolvedValue(),
      start_platform_odometry: vi.fn().mockResolvedValue(),
      get_platform_odometry: vi.fn().mockResolvedValue({ x: 1, y: 2, t: Math.PI / 2 }),
    };
    renderPage(PlatformTab, controller);
    expect(screen.getByLabelText('Maximum rotation speed (deg/s)').valueAsNumber).toBeCloseTo(0.5 * 180 / Math.PI);
    click('Initialize');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Initialize velocity controller' })).toBeEnabled());
    change('Velocity Kp', '0.1');
    click('Initialize velocity controller');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Set Platform Velocity Target' })).toBeEnabled());
    expect(Number(controller.start_platform_controller.mock.calls[0][0])).toBe(0.1);
    expect(Number(controller.start_platform_controller.mock.calls[0][1])).toBeCloseTo(1);
    change('X (m/s)', '0.2');
    change('Heading (deg/s)', '90');
    click('Set Platform Velocity Target');
    await waitFor(() => expect(controller.set_platform_target_velocity).toHaveBeenCalledWith('0.2', 0, String(Math.PI / 2)));
    change('Keyboard angular speed (T, deg/s)', '180');
    fireEvent.click(screen.getByLabelText(/Enable keyboard/));
    fireEvent.keyDown(window, { key: 'a' });
    await waitFor(() => expect(controller.set_platform_target_velocity).toHaveBeenLastCalledWith(0, 0, Math.PI));
    fireEvent.keyUp(window, { key: 'a' });
    click('Start odometry');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Get odometry' })).toBeEnabled());
    click('Get odometry');
    const sample = await screen.findByLabelText('Latest odometry sample');
    await waitFor(() => expect(sample).toHaveTextContent('90.00'));
    expect(sample).toHaveTextContent('deg');
    setUnits('rad');
    expect(screen.getByLabelText('Keyboard angular speed (T, rad/s)').valueAsNumber).toBeCloseTo(Math.PI);
    expect(sample).toHaveTextContent('1.57');
    expect(sample).toHaveTextContent('1.00');
    expect(sample).toHaveTextContent('2.00');
  });

  it.each([['motor', MotorControllerTab], ['platform', PlatformTab]])('keeps all %s velocity gains unchanged when toggling units and sending settings', async (kind, Page) => {
    const controller = {
      boardInfo: { protocol_major: 2, protocol_minor: 3, protocol_patch: 1 },
      initialize_omni_platform: vi.fn().mockResolvedValue(),
      initialize_motor_controller: vi.fn().mockResolvedValue(),
      start_platform_controller: vi.fn().mockResolvedValue(),
      get_motor_controller_state: vi.fn().mockResolvedValue({}),
    };
    renderPage(Page, controller);
    if (kind === 'platform') {
      click('Initialize');
      await waitFor(() => expect(screen.getByRole('button', { name: 'Initialize velocity controller' })).toBeEnabled());
    }
    for (const [label, value] of [['Velocity Kp', '2'], ['Velocity Ki', '0.4'], ['Velocity Kd', '0.03']]) change(label, value);
    for (const unit of ['deg', 'rad', 'deg']) {
      setUnits(unit);
      expect(Number(screen.getByLabelText('Velocity Kp').value)).toBe(2);
      expect(Number(screen.getByLabelText('Velocity Ki').value)).toBe(0.4);
      expect(Number(screen.getByLabelText('Velocity Kd').value)).toBe(0.03);
    }
    click('Initialize velocity controller');
    const initialize = kind === 'motor' ? controller.initialize_motor_controller : controller.start_platform_controller;
    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
    expect(initialize.mock.calls[0].slice(kind === 'motor' ? 5 : 0)).toEqual(['2', '0.4', '0.03', '100']);
  });

  it('suspends platform keyboard driving while Settings is open', async () => {
    const controller = {
      boardInfo: { protocol_major: 2, protocol_minor: 3, protocol_patch: 1 },
      initialize_omni_platform: vi.fn().mockResolvedValue(),
      start_platform_controller: vi.fn().mockResolvedValue(),
      set_platform_target_velocity: vi.fn().mockResolvedValue(),
    };
    render(<SettingsProvider><ControllerContext.Provider value={{ controller, isConnected: true }}>
      <TabContainer>
        <PlatformTab title="Platform" />
        <Settings title="Settings" alwaysEnabled settingsPage />
      </TabContainer>
    </ControllerContext.Provider></SettingsProvider>);
    click('Initialize');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Initialize velocity controller' })).toBeEnabled());
    click('Initialize velocity controller');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Set Platform Velocity Target' })).toBeEnabled());
    fireEvent.click(screen.getByLabelText(/Enable keyboard/));
    fireEvent.keyDown(window, { key: 'a' });
    await waitFor(() => expect(controller.set_platform_target_velocity).toHaveBeenLastCalledWith(0, 0, 1));
    click('Settings');
    await waitFor(() => expect(controller.set_platform_target_velocity).toHaveBeenLastCalledWith(0, 0, 0));
    controller.set_platform_target_velocity.mockClear();
    setUnits('deg');
    fireEvent.keyDown(window, { key: 'w' });
    fireEvent.keyUp(window, { key: 'w' });
    expect(controller.set_platform_target_velocity).not.toHaveBeenCalled();
    click('Platform');
    expect(screen.getByRole('button', { name: 'Set Platform Velocity Target' })).toBeEnabled();
    expect(controller.set_platform_target_velocity).not.toHaveBeenCalled();
  });

  it('converts encoder angles on the Motor page without changing counts', async () => {
    localStorage.setItem(ANGLE_UNIT_STORAGE_KEY, 'deg');
    const controller = {
      initialize_encoder: vi.fn().mockResolvedValue(),
      start_encoder_odometry: vi.fn().mockResolvedValue(),
      get_encoder_odometry: vi.fn().mockResolvedValue({ angle: Math.PI }),
    };
    renderPage(MotorTab, controller);
    click('Initialize encoder');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start odometry' })).toBeEnabled());
    click('Start odometry');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Get odometry' })).toBeEnabled());
    click('Get odometry');
    const sample = screen.getByLabelText('Latest odometry sample');
    await waitFor(() => expect(within(sample).getByText('180')).toBeVisible());
    expect(sample).toHaveTextContent('deg');
    setUnits('rad');
    expect(sample).toHaveTextContent(String(Math.PI));
    expect(controller.get_encoder_odometry).toHaveBeenCalledTimes(1);
  });
});
