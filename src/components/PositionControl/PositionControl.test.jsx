import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import SettingsProvider from '../../contexts/SettingsProvider';
import Settings from '../Settings/Settings';
import { ControllerContext } from '../../contexts/ControllerContext';
import PositionControl from './PositionControl';

vi.mock('react-chartjs-2', () => ({
  Line: ({ data }) => <output data-testid="position-plot">{JSON.stringify(data)}</output>,
}));
afterEach(() => vi.useRealTimers());
beforeEach(() => localStorage.clear());

function fixture(props = {}, overrides = {}) {
  const controller = { boardInfo: { protocol_major: 2, protocol_minor: 3 },
    initialize_motor_position_pid_controller: vi.fn().mockResolvedValue(),
    set_motor_position: vi.fn().mockResolvedValue(), reset_motor_position: vi.fn().mockResolvedValue(),
    get_motor_position: vi.fn().mockResolvedValue(-2 * Math.PI),
    initialize_platform_position_pid_controller: vi.fn().mockResolvedValue(),
    set_platform_position: vi.fn().mockResolvedValue(), reset_platform_position: vi.fn().mockResolvedValue(),
    get_platform_odometry: vi.fn().mockResolvedValue({ x: 1, y: -2, t: 0.5 }), ...overrides };
  render(<SettingsProvider><Settings /><ControllerContext.Provider value={{ controller, isConnected: true }}>
    <PositionControl velocityReady {...props} />
  </ControllerContext.Provider></SettingsProvider>);
  return controller;
}
const click = name => fireEvent.click(screen.getByRole('button', { name, exact: true }));
async function initialize() {
  click('Initialize position controller');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Set position', exact: true })).toBeEnabled());
}

describe('position controls', () => {
  it('requires velocity initialization and supported firmware', () => {
    fixture({ velocityReady: false }, { boardInfo: { protocol_major: 2, protocol_minor: 1 } });
    expect(screen.getByText('Initialize the velocity controller first.')).toBeVisible();
    expect(screen.getByText(/requires firmware protocol 2.3/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Initialize position controller' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Set position', exact: true })).toBeDisabled();
  });
  it('awaits initialization ACK before enabling targets and displays rejected initialization', async () => {
    let reject;
    fixture({}, { initialize_motor_position_pid_controller: vi.fn(() => new Promise((_, r) => { reject = r; })) });
    click('Initialize position controller');
    expect(screen.getByRole('button', { name: 'Set position', exact: true })).toBeDisabled();
    reject(new Error('CONTROLLER_NOT_INITIALIZED'));
    expect(await screen.findByRole('alert')).toHaveTextContent('CONTROLLER_NOT_INITIALIZED');
    expect(screen.getByRole('button', { name: 'Set position', exact: true })).toBeDisabled();
  });
  it('sets and reads multi-turn radians, then resets target to zero', async () => {
    const c = fixture({ motorIndex: 3 });
    await initialize();
    expect(c.initialize_motor_position_pid_controller).toHaveBeenCalledWith(3, 2, 1, 0.02, 0, 0, 1);
    fireEvent.change(screen.getByLabelText('Target position (rad)'), { target: { value: '-12.5' } });
    click('Set position');
    await screen.findByText('Position target accepted.');
    expect(c.set_motor_position).toHaveBeenCalledWith(3, -12.5);
    click('Read position');
    expect(await screen.findByLabelText('Current position')).toHaveTextContent('-6.2832 rad');
    click('Reset position to zero');
    await screen.findByText('Position and target reset to zero.');
    expect(c.reset_motor_position).toHaveBeenCalledWith(3);
    expect(screen.getByLabelText('Target position (rad)')).toHaveValue(0);
  });
  it('sends platform fields in firmware order and exposes missing sample errors', async () => {
    const onOdometryChange = vi.fn();
    const c = fixture({ platform: true, onOdometryChange }, {
      set_platform_position: vi.fn().mockRejectedValue(new Error('SAMPLE_NOT_AVAILABLE')) });
    await initialize();
    expect(c.initialize_platform_position_pid_controller).toHaveBeenCalledWith(1, 2, 0.2, 0.5, 0.01, 0.03, 0, 0, 0.2, 0, 0, 0.5);
    expect(onOdometryChange).toHaveBeenCalledWith(null);
    for (const [label, value] of [['Target X (m)', '1'], ['Target Y (m)', '-2'], ['Target heading (rad)', '0.5']])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    click('Set position');
    expect(await screen.findByRole('alert')).toHaveTextContent('SAMPLE_NOT_AVAILABLE');
    expect(c.set_platform_position).toHaveBeenCalledWith(1, -2, 0.5);
    click('Read position');
    expect(await screen.findByLabelText('Current position')).toHaveTextContent('X 1.000 m');
  });
  it('rejects blank settings without sending and blocks keyboard conflicts', async () => {
    const c = fixture();
    fireEvent.change(screen.getByLabelText('Maximum speed (rad/s)'), { target: { value: '' } });
    click('Initialize position controller');
    expect(await screen.findByRole('alert')).toHaveTextContent('finite number');
    expect(c.initialize_motor_position_pid_controller).not.toHaveBeenCalled();
  });
  it('requires keyboard driving to be off', () => {
    fixture({ platform: true, keyboardEnabled: true });
    expect(screen.getByRole('button', { name: 'Initialize position controller' })).toBeDisabled();
  });
  it('converts motor degree inputs to radians and preserves multi-turn targets when switching units', async () => {
    const c = fixture({ motorIndex: 2 });
    const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
    change('Angle units', 'deg');
    expect(screen.getByLabelText('Maximum speed (deg/s)').valueAsNumber).toBeCloseTo(180 / Math.PI);
    change('Maximum speed (deg/s)', '180');
    change('Position tolerance (deg)', '1');
    change('Position Ki (1/s²)', '0.3');
    change('Position Kd', '0.04');
    change('Integral limit (deg/s)', '180');
    await initialize();
    const args = c.initialize_motor_position_pid_controller.mock.calls[0];
    expect(args.slice(0, 2)).toEqual([2, 2]);
    expect(args[2]).toBeCloseTo(Math.PI);
    expect(args[3]).toBeCloseTo(Math.PI / 180);
    expect(args[4]).toBe(0.3); expect(args[5]).toBe(0.04);
    expect(args[6]).toBeCloseTo(Math.PI);
    change('Target position (deg)', '-720');
    click('Set position');
    await screen.findByText('Position target accepted.');
    expect(c.set_motor_position).toHaveBeenCalledWith(2, -4 * Math.PI);
    click('Read position');
    expect(await screen.findByLabelText('Current position')).toHaveTextContent('-360.0000 deg');
    change('Angle units', 'rad');
    expect(screen.getByLabelText('Target position (rad)').valueAsNumber).toBeCloseTo(-4 * Math.PI);
    expect(screen.getByLabelText('Maximum speed (rad/s)').valueAsNumber).toBeCloseTo(Math.PI);
    expect(screen.getByLabelText('Current position')).toHaveTextContent('-6.2832 rad');
    change('Angle units', 'deg');
    expect(screen.getByLabelText('Target position (deg)').valueAsNumber).toBeCloseTo(-720);
    expect(c.set_motor_position).toHaveBeenCalledTimes(1);
    expect(c.initialize_motor_position_pid_controller).toHaveBeenCalledTimes(1);
    click('Reset position to zero');
    await screen.findByText('Position and target reset to zero.');
    expect(screen.getByLabelText('Target position (deg)')).toHaveValue(0);
  });
  it('converts only angular platform values and keeps odometry callbacks in radians', async () => {
    const onOdometryChange = vi.fn();
    const c = fixture({ platform: true, onOdometryChange }, {
      get_platform_odometry: vi.fn().mockResolvedValue({ x: 1, y: -2, t: Math.PI / 2 }) });
    const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
    change('Angle units', 'deg');
    change('Maximum rotation speed (deg/s)', '90');
    change('Heading tolerance (deg)', '2');
    change('Translation Ki (1/s²)', '0.1');
    change('Translation Kd', '0.02');
    change('Heading Ki (1/s²)', '0.3');
    change('Heading Kd', '0.04');
    change('Heading integral limit (deg/s)', '90');
    await initialize();
    const args = c.initialize_platform_position_pid_controller.mock.calls[0];
    expect(args.slice(0, 3)).toEqual([1, 2, 0.2]);
    expect(args[3]).toBeCloseTo(Math.PI / 2);
    expect(args[4]).toBe(0.01);
    expect(args[5]).toBeCloseTo(Math.PI / 90);
    expect(args.slice(6, 11)).toEqual([0.1, 0.02, 0.2, 0.3, 0.04]);
    expect(args[11]).toBeCloseTo(Math.PI / 2);
    change('Target X (m)', '1');
    change('Target Y (m)', '-2');
    change('Target heading (deg)', '90');
    click('Set position');
    await screen.findByText('Position target accepted.');
    expect(c.set_platform_position).toHaveBeenCalledWith(1, -2, Math.PI / 2);
    click('Read position');
    expect(await screen.findByLabelText('Current position')).toHaveTextContent('X 1.000 m · Y -2.000 m · Heading 90.000 deg');
    expect(onOdometryChange).toHaveBeenLastCalledWith({ x: 1, y: -2, t: Math.PI / 2 });
  });
  it('keeps blank inputs blank when switching units and rejects them without sending', async () => {
    const c = fixture();
    fireEvent.change(screen.getByLabelText('Maximum speed (rad/s)'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Angle units'), { target: { value: 'deg' } });
    expect(screen.getByLabelText('Maximum speed (deg/s)')).toHaveValue(null);
    click('Initialize position controller');
    expect(await screen.findByRole('alert')).toHaveTextContent('finite number');
    expect(c.initialize_motor_position_pid_controller).not.toHaveBeenCalled();
  });
  it('graphs measured position with acknowledged targets, converts history and clears it on reset', async () => {
    const c = fixture();
    await initialize();
    fireEvent.change(screen.getByLabelText('Target position (rad)'), { target: { value: '3.141592653589793' } });
    click('Set position');
    await screen.findByText('Position target accepted.');
    vi.useFakeTimers();
    // Restart the timer in the fake clock domain.
    fireEvent.click(screen.getByLabelText('Live position graph'));
    fireEvent.click(screen.getByLabelText('Live position graph'));
    await act(() => vi.advanceTimersByTimeAsync(500));
    const data = () => JSON.parse(screen.getByTestId('position-plot').textContent).datasets;
    expect(c.get_motor_position).toHaveBeenCalledTimes(1);
    expect(data()[0].data[0].y).toBeCloseTo(-2 * Math.PI);
    expect(data()[1].data[0].y).toBeCloseTo(Math.PI);
    fireEvent.change(screen.getByLabelText('Angle units'), { target: { value: 'deg' } });
    expect(data()[0].data[0].y).toBeCloseTo(-360);
    expect(data()[1].data[0].y).toBeCloseTo(180);
    fireEvent.click(screen.getByLabelText('Live position graph'));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(c.get_motor_position).toHaveBeenCalledTimes(1);
    await act(async () => click('Reset position to zero'));
    expect(data()[0].data).toEqual([]);
  });
  it('serializes graph polling and discards an in-flight sample when paused', async () => {
    let resolve;
    const c = fixture({}, { get_motor_position: vi.fn(() => new Promise(r => { resolve = r; })) });
    await initialize();
    vi.useFakeTimers();
    fireEvent.click(screen.getByLabelText('Live position graph'));
    fireEvent.click(screen.getByLabelText('Live position graph'));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(c.get_motor_position).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Live position graph'));
    await act(async () => resolve(2));
    expect(screen.getByText('No position samples yet.')).toBeVisible();
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(c.get_motor_position).toHaveBeenCalledTimes(1);
  });
  it('pauses graph polling after read failure without retrying automatically', async () => {
    const c = fixture({}, { get_motor_position: vi.fn().mockRejectedValue(new Error('SAMPLE_NOT_AVAILABLE')) });
    await initialize();
    vi.useFakeTimers();
    fireEvent.click(screen.getByLabelText('Live position graph'));
    fireEvent.click(screen.getByLabelText('Live position graph'));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByRole('alert')).toHaveTextContent('Position graph paused: SAMPLE_NOT_AVAILABLE');
    expect(screen.getByLabelText('Live position graph')).not.toBeChecked();
    expect(c.get_motor_position).toHaveBeenCalledTimes(1);
  });
});
