import { useCallback, useEffect, useRef, useState } from 'react';
import { supportsDriverSleep } from '../../commands/board_profile';
import { ErrorCode } from '../../commands/kinisi_commands';

export default function DriverSleep({ controller, isConnected, isActive = true }) {
  const connection = controller?.boardInfo;
  const supported = supportsDriverSleep(connection);
  const available = isConnected && controller?.ready && supported;
  const [state, setState] = useState(null);
  const operation = useRef({ id: 0, busy: false });
  const current = available && state?.controller === controller && state.connection === connection ? state : null;

  const update = useCallback(async (requested = null, background = false) => {
    if (operation.current.busy) return;
    const id = ++operation.current.id;
    operation.current.busy = true;
    setState(previous => ({ controller, connection,
      value: previous?.controller === controller && previous.connection === connection ? previous.value : null,
      busy: true, error: background ? previous?.error : '' }));
    try {
      if (requested !== null) await controller.set_driver_sleep(requested);
      if (operation.current.id !== id) return;
      const value = await controller.get_driver_sleep();
      if (value !== 0 && value !== 1) throw new Error('The board returned an invalid sleep state.');
      if (operation.current.id !== id) return;
      setState(previous => ({ controller, connection, value, busy: false,
        error: requested !== null && value !== requested
          ? 'The readback differs from your request. Another connection may have changed the state; read it again before continuing.'
          : background ? previous?.error : '' }));
    } catch (error) {
      if (operation.current.id !== id) return;
      const guidance = requested === 0 && error.code === ErrorCode.INTERNAL_ERROR
        ? 'Wake failed; the drivers remain inhibited. Check motor power and driver faults, then retry Wake drivers.'
        : requested !== null
          ? 'The requested state is not confirmed. Read driver state, then retry if needed.'
          : 'Could not read driver state. Check the connection and try Read driver state again.';
      setState({ controller, connection, value: null, busy: false, error: `${guidance} ${error.message || ''}` });
    } finally {
      if (operation.current.id === id) operation.current.busy = false;
    }
  }, [controller, connection]);

  useEffect(() => {
    const requests = operation.current;
    if (!available || !isActive) return;
    // Read the external board state on entry; never automatically sleep or wake it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    update();
    const timer = setInterval(() => update(null, true), 2000);
    return () => { clearInterval(timer); requests.id++; requests.busy = false; };
  }, [available, isActive, update]);

  return <section className="control-section" aria-labelledby="driverSleepTitle">
    <h3 id="driverSleepTitle">Driver sleep — all motors</h3>
    {!supported ? <p className="section-help">Manual driver sleep requires a supported v0.4 board and firmware protocol 2.15 or newer.</p>
      : !available ? <p>Connect and wait for the controller to be ready.</p> : <>
        <p className="section-help">Sleep stops motion and controllers on every connection. Wake checks the retained driver settings and leaves outputs stopped. Restart controllers and send fresh motion commands when ready.</p>
        <p><output aria-label="Driver sleep state" aria-live="polite">{current?.value === 1
          ? 'Asleep — motor commands inhibited' : current?.value === 0
            ? 'Awake — board-wide inhibit cleared' : 'State not verified'}</output></p>
        <p className="section-help">This is the board-wide inhibit, not the power state of each individual driver. It is not saved with configuration and clears at boot. State refreshes every 2 seconds while this tab is open.</p>
        <div className="action-row">
          <button type="button" className="k-button" disabled={current?.busy} onClick={() => update()}>Read driver state</button>
          <button type="button" className="k-button" disabled={current?.busy} onClick={() => update(1)}>Sleep drivers</button>
          <button type="button" className="k-button" disabled={current?.busy} onClick={() => update(0)}>Wake drivers</button>
        </div>
        {current?.error && <p role="alert" className="conn-error">{current.error}</p>}
      </>}
  </section>;
}
