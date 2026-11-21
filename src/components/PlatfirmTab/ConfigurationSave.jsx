import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorCode } from '../../commands/kinisi_commands';
import { supportsConfigurationPersistence } from '../../commands/board_profile';
import { readRunningConfiguration } from '../../commands/configuration';

function failureMessage(error, saving) {
  if (error.code === ErrorCode.PLATFORM_NOT_INITIALIZED)
    return 'No complete platform setup is running. Initialize your platform, then save again.';
  if (error.code === ErrorCode.SENSOR_NOT_AVAILABLE)
    return 'Onboard configuration storage is unavailable. Check the v0.4 board and firmware.';
  if (error.code === ErrorCode.INVALID_ARGUMENT)
    return 'The running setup cannot be saved. Check platform geometry, encoder resolution and directions, then apply the corrected setup.';
  if (error.code === ErrorCode.INTERNAL_ERROR)
    return 'The board could not verify the storage write. Keep power connected and retry. This save is not confirmed.';
  if (saving) return `Save not confirmed. Reconnect if needed and save again before power cycling. ${error.message || 'The connection failed.'}`;
  return `Could not read the running setup. Reconnect or try Read running setup again. ${error.message || ''}`;
}

export default function ConfigurationSave({ controller, isConnected, onLoaded, onBusy }) {
  const connection = controller?.boardInfo;
  const supported = supportsConfigurationPersistence(connection);
  const available = isConnected && controller?.ready && supported;
  const [state, setState] = useState(null);
  const operation = useRef({ id: 0 });
  const current = state?.controller === controller && state.connection === connection ? state : null;
  const read = useCallback(async () => {
    const id = ++operation.current.id;
    onBusy(true);
    setState({ controller, connection, busy: true });
    try {
      const setup = await readRunningConfiguration(controller);
      if (operation.current.id !== id) return;
      setState({ controller, connection, setup, busy: false });
      onLoaded(setup);
    } catch (error) {
      if (operation.current.id === id) setState({ controller, connection, busy: false, error: failureMessage(error, false) });
    } finally { if (operation.current.id === id) onBusy(false); }
  }, [controller, connection, onLoaded, onBusy]);
  useEffect(() => {
    const requests = operation.current;
    // Synchronize the new external board session, including its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (available) read();
    return () => { requests.id++; onBusy(false); };
  }, [available, read, onBusy]);
  const save = async () => {
    const id = ++operation.current.id;
    onBusy(true);
    setState({ controller, connection, busy: true });
    try {
      await controller.save_configuration();
      if (operation.current.id === id) setState({ controller, connection, busy: false, saved: true });
    } catch (error) {
      if (operation.current.id === id) setState({ controller, connection, busy: false, error: failureMessage(error, true) });
    } finally { if (operation.current.id === id) onBusy(false); }
  };
  return <section className="control-section" aria-labelledby="configurationSaveTitle">
    <h3 id="configurationSaveTitle">Save setup on the board</h3>
    <p className="section-help">Save the applied platform geometry, encoder setup, motor and encoder directions, and motor PWM frequency to onboard memory. Apply form changes first: Save does not apply these inputs or browser Settings.</p>
    <p className="section-help">On startup, saved setup is restored with motors stopped. Motion targets, PID controllers and driver current-limit settings are not restored. Reading the running setup does not initialize or move the platform.</p>
    {!supported ? <p>Requires a known Kinisi v0.4 board and firmware protocol 2.14 or newer.</p>
      : !available ? <p>Connect and wait for the controller to be ready.</p> : <>
        <button type="button" className="k-button" disabled={current?.busy} onClick={read}>Read running setup</button>
        <button type="button" className="k-button" disabled={current?.busy} onClick={save}>{current?.busy ? 'Working…' : 'Save configuration'}</button>
        {current?.setup && <p role="status">Running {current.setup.platform} setup loaded. PWM: {current.setup.pwmHz / 1000} kHz. This read does not confirm a saved copy.</p>}
        {current?.setup && current.setup.encoders.slice(0, current.setup.channelCount).some(encoder => encoder.resolution === 0) &&
          <p>Some platform encoders are not initialized. Open-loop platform setup can still be saved; configure encoders before starting velocity or position control.</p>}
        {current?.setup && new Set(current.setup.encoders.slice(0, current.setup.channelCount).map(encoder => encoder.resolution)).size > 1 &&
          <p>The running encoders use different resolutions. The form shows channel 0; Initialize applies that single resolution to every platform encoder. Save preserves the running values.</p>}
        {current && !current.busy && Object.hasOwn(current, 'setup') && !current.setup && <p>No platform setup is running. Initialize the platform before saving.</p>}
        {current?.saved && <p role="status">Configuration saved and verified by the board. It will restore at startup with motors stopped.</p>}
        {current?.error && <p role="alert" className="conn-error">{current.error}</p>}
      </>}
  </section>;
}
