import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { StrictMode } from 'react';
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

it('offers the three configurable layouts with accessible drawings and links to worked examples', () => {
  render(<SettingsProvider><ControllerContext.Provider value={{ controller: null, isConnected: false }}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  const selector = screen.getByLabelText('Platform:');
  expect(Array.from(selector.options, option => option.value).sort()).toEqual(['differential', 'mecanum', 'omni']);
  expect(screen.queryByRole('button', { name: /custom layout/i })).not.toBeInTheDocument();
  for (const [preset, field] of [['omni', 'Platform radius (meters)'], ['differential', 'Wheel base (meters)'], ['mecanum', 'Platform length (meters)']]) {
    fireEvent.change(selector, { target: { value: preset } });
    const drawing = within(screen.getByRole('region', { name: new RegExp(preset + ' layout', 'i') }));
    expect(screen.getByLabelText(field)).toBeInTheDocument();
    expect(drawing.getByRole('img', { name: new RegExp(preset + ' chassis.*W0.*positive yaw', 'i') }))
      .toHaveAttribute('src', expect.stringContaining(preset + '.svg'));
    expect(drawing.queryByText('Example setup')).not.toBeInTheDocument();
    expect(drawing.getByRole('link', { name: 'First-drive guide' })).toHaveAttribute(
      'href', 'https://vsreality.com/docs/kinisi-motor-controller/tutorials/first-drive/');
  }
});

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
  const panel = within(screen.getByRole('region', { name: 'Save setup on the board' }));
  expect(panel.getByText('Save stores the setup currently running on the board.')).toBeInTheDocument();
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

it('lets installers match the mirrored drawing and rejects square geometry before applying any setup', async () => {
  const c = client();
  c.boardInfo = { ...boardInfo, board_minor: 3, protocol_minor: 25 };
  c.get_configuration_field.mockResolvedValue(1);
  c.initialize_mecanum_platform_oriented = vi.fn();
  c.initialize_mecanum_platform = vi.fn();
  render(<SettingsProvider><ControllerContext.Provider value={{controller:c,isConnected:true}}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  fireEvent.change(screen.getByLabelText('Platform:'), {target:{value:'mecanum'}});
  const selector = screen.getByLabelText('Roller arrangement');
  fireEvent.change(selector, {target:{value:'1'}});
  expect(screen.getByRole('img', {name:/Mecanum chassis.*Mirrored/i})).toHaveAttribute('src', expect.stringContaining('mecanum-mirrored.svg'));
  expect(screen.getByRole('alert')).toHaveTextContent('cannot control yaw');
  expect(screen.getByRole('button',{name:'Initialize'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Platform length (meters)'), {target:{value:'0.4'}});
  fireEvent.change(screen.getByLabelText('Platform width (meters)'), {target:{value:'0.3'}});
  fireEvent.click(screen.getByLabelText('Reverse motor M0'));
  fireEvent.click(screen.getByLabelText('Reverse encoder E1'));
  expect(c.initialize_mecanum_platform_oriented).not.toHaveBeenCalled();
  click('Initialize');
  await screen.findByText('Running roller arrangement: Mirrored (O).');
  expect(c.initialize_mecanum_platform_oriented).toHaveBeenCalledExactlyOnceWith(
    true,false,false,false,false,true,false,false,.4,.3,.1,1425.1,1);
  expect(c.get_configuration_field).toHaveBeenCalledWith(7,0);
  expect(c.initialize_mecanum_platform).not.toHaveBeenCalled();
  expect(c.save_configuration).not.toHaveBeenCalled();
  fireEvent.change(selector,{target:{value:'0'}});
  expect(screen.queryByText('Running roller arrangement: Mirrored (O).')).not.toBeInTheDocument();
  click('Read running roller arrangement');
  await screen.findByText('Running roller arrangement: Mirrored (O).');
  expect(selector).toHaveValue('1');
});

it('shows only the standard pattern on old firmware and uses its original initializer', async () => {
  const c = client();
  c.boardInfo = {...boardInfo, board_minor:3, protocol_minor:24};
  c.initialize_mecanum_platform = vi.fn();
  c.initialize_mecanum_platform_oriented = vi.fn();
  render(<SettingsProvider><ControllerContext.Provider value={{controller:c,isConnected:true}}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  fireEvent.change(screen.getByLabelText('Platform:'),{target:{value:'mecanum'}});
  expect(screen.getByLabelText('Roller arrangement')).toHaveValue('0');
  expect(screen.getByLabelText('Roller arrangement')).toBeDisabled();
  expect(screen.getByRole('img',{name:/Mecanum chassis.*Standard/i})).toHaveAttribute('src', expect.stringContaining('mecanum.svg'));
  click('Initialize');
  await waitFor(() => expect(c.initialize_mecanum_platform).toHaveBeenCalledExactlyOnceWith(
    false,false,false,false,false,false,false,false,.5,.5,.1,1425.1));
  expect(c.initialize_mecanum_platform_oriented).not.toHaveBeenCalled();
  expect(c.get_configuration_field).not.toHaveBeenCalled();
});

it('clears direct roller confirmation on failed reads and discards a late response after another preset is applied', async () => {
  const c = client();
  c.boardInfo = {...boardInfo, board_minor:3, protocol_minor:25};
  c.get_configuration_field.mockResolvedValue(1);
  render(<SettingsProvider><ControllerContext.Provider value={{controller:c,isConnected:true}}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  const select = value => fireEvent.change(screen.getByLabelText('Platform:'),{target:{value}});
  const confirmed = /Running roller arrangement:/;
  const read = () => click('Read running roller arrangement');
  select('mecanum');
  read();
  await screen.findByText(confirmed);
  c.get_configuration_field.mockRejectedValueOnce(new Error('Field 7 read timed out'));
  read();
  await screen.findByText('Field 7 read timed out');
  expect(screen.queryByText(confirmed)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Roller arrangement')).toHaveValue('1');
  read();
  await screen.findByText(confirmed);
  let resolve;
  c.get_configuration_field.mockImplementationOnce(() => new Promise(done => {resolve = done;}));
  read();
  expect(screen.queryByText(confirmed)).not.toBeInTheDocument();
  select('differential');
  click('Initialize');
  await waitFor(() => expect(c.initialize_differential_platform).toHaveBeenCalledTimes(1));
  select('mecanum');
  await act(async () => resolve(0));
  expect(screen.queryByText(confirmed)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Roller arrangement')).toHaveValue('1');
});

it('invalidates roller confirmation on v0.4 full reload failure and when the running platform changes', async () => {
  const c = client();
  c.boardInfo = {...boardInfo, protocol_minor:25};
  let type = 3;
  c.get_configuration_field.mockImplementation(async field => [type,.1,.4,.3,2048,0,0,1][field]);
  render(<SettingsProvider><ControllerContext.Provider value={{controller:c,isConnected:true}}><PlatformTab isActive={false}/></ControllerContext.Provider></SettingsProvider>);
  const confirmed = /Running roller arrangement:/;
  await screen.findByText(confirmed);
  c.get_configuration_field.mockRejectedValueOnce(new Error('Setup read timed out'));
  click('Read running setup');
  await screen.findByText(/Setup read timed out/);
  expect(screen.queryByText(confirmed)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Roller arrangement')).toHaveValue('1');
  click('Read running setup');
  await screen.findByText(confirmed);
  type = 1;
  click('Read running setup');
  await screen.findByText(/Running differential setup loaded/);
  fireEvent.change(screen.getByLabelText('Platform:'),{target:{value:'mecanum'}});
  expect(screen.queryByText(confirmed)).not.toBeInTheDocument();
});

it.each([3, 4])('preserves a roller edit made during initialization on v0.%i', async boardMinor => {
  const c = client();
  c.boardInfo = {...boardInfo, board_minor:boardMinor, protocol_minor:25};
  let acknowledge;
  c.initialize_mecanum_platform_oriented = vi.fn(() => new Promise(resolve => {acknowledge = resolve;}));
  let platform = 1;
  c.get_configuration_field.mockImplementation(async field => [platform,.1,.4,.3,1000,0,0,0][field]);
  render(<StrictMode><SettingsProvider><ControllerContext.Provider value={{controller:c,isConnected:true}}><PlatformTab /></ControllerContext.Provider></SettingsProvider></StrictMode>);
  if (boardMinor === 4) await screen.findByText(/Running differential setup loaded/);
  fireEvent.change(screen.getByLabelText('Platform:'),{target:{value:'mecanum'}});
  click('Initialize');
  expect(c.initialize_mecanum_platform_oriented).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Roller arrangement'),{target:{value:'1'}});
  platform = 3;
  await act(async () => acknowledge());
  if (boardMinor === 4) await screen.findByText(/Running mecanum setup loaded/);
  expect(screen.getByLabelText('Roller arrangement')).toHaveValue('1');
  expect(screen.queryByText(/Running roller arrangement:/)).not.toBeInTheDocument();
});
it.each([3,4])('applies front-wheel Omni, reads the board, and protects newer drafts on v0.%i', async boardMinor => {
  const c = client();
  c.boardInfo = {...boardInfo, board_minor:boardMinor, protocol_minor:26};
  let running = 0;
  let acknowledge;
  c.initialize_omni_platform_oriented = vi.fn((...args) => new Promise(resolve => {
    acknowledge = () => { running = args[9]; resolve(); };
  }));
  c.get_configuration_field.mockImplementation(async field => [2,.1,0,.15,2048,0,0,0,running][field]);
  render(<StrictMode><SettingsProvider><ControllerContext.Provider value={{controller:c,isConnected:true}}><PlatformTab /></ControllerContext.Provider></SettingsProvider></StrictMode>);
  const confirmed = /Running wheel arrangement:/;
  if (boardMinor === 4) await screen.findByText('Running wheel arrangement: Rear (W2).');
  const select = value => fireEvent.change(screen.getByLabelText('Single wheel position'),{target:{value}});
  select('1');
  fireEvent.click(screen.getByLabelText('Reverse motor M0'));
  fireEvent.click(screen.getByLabelText('Reverse encoder E1'));
  expect(screen.getByRole('img',{name:/Omni chassis.*at the front/})).toHaveAttribute('src',expect.stringContaining('omni-front.svg'));
  expect(c.initialize_omni_platform_oriented).not.toHaveBeenCalled();
  click('Initialize');
  expect(c.initialize_omni_platform_oriented).toHaveBeenLastCalledWith(true,false,false,false,true,false,.1,.15,boardMinor === 4 ? 2048 : 1425.1,1);
  await act(async () => acknowledge());
  await screen.findByText('Running wheel arrangement: Front (W2).');
  expect(c.get_configuration_field).toHaveBeenCalledWith(8,0);
  click('Initialize');
  select('0');
  await act(async () => acknowledge());
  expect(screen.getByLabelText('Single wheel position')).toHaveValue('0');
  expect(screen.queryByText(confirmed)).not.toBeInTheDocument();
  const read = () => click(boardMinor === 4 ? 'Read running setup' : 'Read running wheel arrangement');
  read();
  await screen.findByText('Running wheel arrangement: Front (W2).');
  c.get_configuration_field.mockRejectedValueOnce(new Error('Wheel read failed'));
  read();
  await screen.findByText(/Wheel read failed/);
  expect(screen.queryByText(confirmed)).not.toBeInTheDocument();
  expect(c.save_configuration).not.toHaveBeenCalled();
});

it('uses the original Omni initializer on older firmware and never requests field 8', async () => {
  const c = client();
  c.boardInfo = {...boardInfo, board_minor:3, protocol_minor:25};
  c.initialize_omni_platform = vi.fn();
  render(<SettingsProvider><ControllerContext.Provider value={{controller:c,isConnected:true}}><PlatformTab /></ControllerContext.Provider></SettingsProvider>);
  expect(screen.getByLabelText('Single wheel position')).toBeDisabled();
  expect(screen.getByLabelText('Single wheel position')).toHaveValue('0');
  click('Initialize');
  await waitFor(() => expect(c.initialize_omni_platform).toHaveBeenCalledExactlyOnceWith(false,false,false,false,false,false,.1,.15,1425.1));
  expect(c.get_configuration_field).not.toHaveBeenCalled();
});
