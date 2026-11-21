import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { ErrorCode } from '../../commands/kinisi_commands';
import ConfigurationSave from './ConfigurationSave';
import PlatformTab from './PlatfirmTab';
import SettingsProvider from '../../contexts/SettingsProvider';
import { ControllerContext } from '../../contexts/ControllerContext';

vi.mock('react-chartjs-2', () => ({ Line: () => null }));

const boardInfo = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 14 };
const client = () => ({ boardInfo, ready: true,
  get_configuration_field: vi.fn(async field => [1, 0.12, 0.4, 0, 2048, 0, 1][field]),
  get_pwm_frequency: vi.fn().mockResolvedValue(25000), save_configuration: vi.fn().mockResolvedValue(),
  initialize_differential_platform: vi.fn(), start_platform_controller: vi.fn() });
const click = name => fireEvent.click(screen.getByRole('button', { name }));

it('loads applied setup on opening Platform without initialization and saves only on explicit click', async () => {
  const c = client();
  render(<SettingsProvider><ControllerContext.Provider value={{ controller: c, isConnected: true }}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  await screen.findByText(/Running differential setup loaded/);
  expect(screen.getByLabelText('Platform:')).toHaveValue('differential');
  expect(screen.getByLabelText('Wheel base (meters)')).toHaveValue(0.4);
  expect(screen.getByLabelText('Encoder Resolution (ticks/rev):')).toHaveValue(2048);
  expect(screen.getByRole('button', { name: 'Initialize velocity controller' })).toBeEnabled();
  expect(c.initialize_differential_platform).not.toHaveBeenCalled();
  expect(c.start_platform_controller).not.toHaveBeenCalled();
  expect(c.save_configuration).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Wheel base (meters)'), { target: { value: '0.8' } });
  click('Save configuration');
  await screen.findByText(/Configuration saved and verified by the board/);
  expect(c.save_configuration).toHaveBeenCalledExactlyOnceWith();
  expect(c.initialize_differential_platform).not.toHaveBeenCalled();
  expect(screen.getByText(/Save does not apply these inputs or browser Settings/)).toBeInTheDocument();
});

it('waits for ACK, suppresses duplicate saves, and replaces success with actionable failure', async () => {
  const c = client(), onLoaded = vi.fn(), onBusy = vi.fn();
  render(<ConfigurationSave controller={c} isConnected onLoaded={onLoaded} onBusy={onBusy} />);
  await screen.findByText(/Running differential/);
  let resolve;
  c.save_configuration.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  click('Save configuration');
  expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
  expect(screen.queryByText(/Configuration saved and verified/)).not.toBeInTheDocument();
  await act(async () => resolve());
  await screen.findByText(/Configuration saved and verified/);
  c.save_configuration.mockRejectedValue({ code: ErrorCode.INTERNAL_ERROR });
  click('Save configuration');
  await screen.findByRole('alert');
  expect(screen.getByRole('alert')).toHaveTextContent('This save is not confirmed');
  expect(screen.queryByText(/Configuration saved and verified/)).not.toBeInTheDocument();
});

it('discards pending save success after disconnect and reads a fresh connection without reinitializing', async () => {
  const c = client(), onLoaded = vi.fn(), onBusy = vi.fn();
  const view = render(<ConfigurationSave controller={c} isConnected onLoaded={onLoaded} onBusy={onBusy} />);
  await screen.findByText(/Running differential/);
  let resolve;
  c.save_configuration.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  click('Save configuration');
  view.rerender(<ConfigurationSave controller={c} isConnected={false} onLoaded={onLoaded} onBusy={onBusy} />);
  await act(async () => resolve());
  expect(screen.queryByText(/Configuration saved and verified/)).not.toBeInTheDocument();
  c.boardInfo = { ...boardInfo };
  view.rerender(<ConfigurationSave controller={c} isConnected onLoaded={onLoaded} onBusy={onBusy} />);
  await screen.findByText(/Running differential/);
  expect(onLoaded).toHaveBeenCalledTimes(2);
  expect(c.initialize_differential_platform).not.toHaveBeenCalled();
});

it.each([{}, { protocol_minor: 13 }, { board_minor: 3 }, { board_patch: 1 }])('gates unavailable identity %s', async override => {
  const c = client(); c.boardInfo = Object.keys(override).length ? { ...boardInfo, ...override } : null;
  render(<ConfigurationSave controller={c} isConnected onLoaded={vi.fn()} onBusy={vi.fn()} />);
  expect(screen.getByText(/Requires a known Kinisi v0.4/)).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  await waitFor(() => expect(c.get_configuration_field).not.toHaveBeenCalled());
});

it('shows unconfigured setup and guidance when the board rejects saving', async () => {
  const c = client(); c.get_configuration_field.mockResolvedValue(0);
  c.save_configuration.mockRejectedValue({ code: ErrorCode.PLATFORM_NOT_INITIALIZED });
  render(<ConfigurationSave controller={c} isConnected onLoaded={vi.fn()} onBusy={vi.fn()} />);
  await screen.findByText(/No platform setup is running/);
  click('Save configuration');
  await screen.findByRole('alert');
  expect(screen.getByRole('alert')).toHaveTextContent('Initialize your platform, then save again');
});

it('keeps encoder-free and mixed resolutions saveable without applying the common form value', async () => {
  const c = client();
  c.get_configuration_field.mockImplementation(async (field, index) =>
    [1, 0.12, 0.4, 0, index === 1 ? 2048 : 0, 0, 1][field]);
  render(<ConfigurationSave controller={c} isConnected onLoaded={vi.fn()} onBusy={vi.fn()} />);
  await screen.findByText(/Running differential/);
  expect(screen.getByText(/Some platform encoders are not initialized/)).toBeInTheDocument();
  expect(screen.getByText(/The running encoders use different resolutions/)).toBeInTheDocument();
  click('Save configuration');
  await screen.findByText(/Configuration saved and verified/);
  expect(c.save_configuration).toHaveBeenCalledExactlyOnceWith();
  expect(c.initialize_differential_platform).not.toHaveBeenCalled();
});

it.each([[0, 0], [1024, 0]])('blocks encoder-dependent starts for running resolutions %s, %s', async (first, second) => {
  const c = client();
  c.get_configuration_field.mockImplementation(async (field, index) =>
    field === 4 ? [first, second, 0, 0][index] : [1, 0.12, 0.4, 0, 0, 0, 1][field]);
  render(<SettingsProvider><ControllerContext.Provider value={{ controller: c, isConnected: true }}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  await screen.findByText(/Running differential/);
  expect(screen.getByRole('button', { name: 'Initialize velocity controller' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Start odometry' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Set Platform Velocity' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Save configuration' })).toBeEnabled();
  expect(screen.getByText(/odometry require an initialized encoder on every platform wheel/)).toBeInTheDocument();
  // An unapplied input must never grant encoder-dependent operation.
  fireEvent.change(screen.getByLabelText('Encoder Resolution (ticks/rev):'), { target: { value: '2048' } });
  expect(screen.getByRole('button', { name: 'Initialize velocity controller' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Start odometry' })).toBeDisabled();
});

it('allows different initialized wheel resolutions and clears saved confirmation after applying setup', async () => {
  const c = client();
  c.get_configuration_field.mockImplementation(async (field, index) =>
    field === 4 ? [1024, 2048, 0, 0][index] : [1, 0.12, 0.4, 0, 0, 0, 1][field]);
  render(<SettingsProvider><ControllerContext.Provider value={{ controller: c, isConnected: true }}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  await screen.findByText(/Running differential/);
  expect(screen.getByRole('button', { name: 'Initialize velocity controller' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Start odometry' })).toBeEnabled();
  click('Save configuration');
  await screen.findByText(/Configuration saved and verified/);
  fireEvent.change(screen.getByLabelText('Wheel base (meters)'), { target: { value: '0.8' } });
  c.get_configuration_field.mockImplementation(async (field, index) =>
    field === 4 ? [1024, 1024, 0, 0][index] : [1, 0.12, 0.8, 0, 0, 0, 1][field]);
  click('Initialize');
  await screen.findByText(/Running differential/);
  expect(screen.queryByText(/Configuration saved and verified/)).not.toBeInTheDocument();
  expect(screen.queryByText(/running encoders use different resolutions/)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Wheel base (meters)')).toHaveValue(0.8);
  expect(c.save_configuration).toHaveBeenCalledTimes(1);
});
