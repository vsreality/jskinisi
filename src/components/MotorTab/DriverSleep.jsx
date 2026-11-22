import { useContext } from 'react';
import { BoardPowerContext } from '../../contexts/BoardPowerContext';
import BoardPowerProvider from '../../contexts/BoardPowerProvider';

function PowerControls() {
  const { available, driverSupported, idleSupported, current, update } = useContext(BoardPowerContext);
  const driversBlocked = current?.busy || (idleSupported && current?.idle !== 0);
  return <>
    <section className="control-section" aria-labelledby="boardIdleTitle">
      <h3 id="boardIdleTitle">Board idle</h3>
      {!idleSupported ? <p className="section-help">Board idle requires a supported v0.4 board and firmware protocol 2.16 or newer.</p>
        : !available ? <p>Connect and wait for the controller to be ready.</p> : <>
          <p className="section-help">Idle stops motion, sleeps the drivers and pauses automatic telemetry. USB and I²C communication, heartbeat, time sync and direct reads remain available.</p>
          <p><output aria-label="Board idle state" aria-live="polite">{current?.transition === 'board' ? 'Changing board state…'
            : current?.idle === 1 ? 'Idle — automatic telemetry paused' : current?.idle === 0 ? 'Active — board idle cleared' : 'State not verified'}</output></p>
          <p className="section-help">Wake board preserves driver sleep if it was active before idle. Otherwise it verifies the drivers and leaves outputs stopped. Existing subscriptions resume with fresh samples; restart controllers before requesting new motion.</p>
          <div className="action-row">
            <button type="button" className="k-button" disabled={current?.busy} onClick={() => update()}>Read board state</button>
            <button type="button" className="k-button" disabled={current?.busy} onClick={() => update('board', 1)}>Enter board idle</button>
            <button type="button" className="k-button" disabled={current?.busy} onClick={() => update('board', 0)}>Wake board</button>
          </div>
        </>}
    </section>
    <section className="control-section" aria-labelledby="driverSleepTitle">
      <h3 id="driverSleepTitle">Driver sleep — all motors</h3>
      {!driverSupported ? <p className="section-help">Manual driver sleep requires a supported v0.4 board and firmware protocol 2.15 or newer.</p>
        : !available ? <p>Connect and wait for the controller to be ready.</p> : <>
          <p className="section-help">Sleep stops motion and controllers on every connection. Wake checks the retained driver settings and leaves outputs stopped. Restart controllers and send fresh motion commands when ready.</p>
          <p><output aria-label="Driver sleep state" aria-live="polite">{current?.sleeping === 1
            ? 'Asleep — motor commands inhibited' : current?.sleeping === 0 ? 'Awake — board-wide inhibit cleared' : 'State not verified'}</output></p>
          <p className="section-help">This is the board-wide inhibit, not the power state of each individual driver. Power states are not saved with configuration and clear at boot. One shared read refreshes them every 2 seconds while connected.</p>
          {idleSupported && current?.idle !== 0 && <p>Wake board before changing driver sleep. If board state is unknown, read it first.</p>}
          <div className="action-row">
            <button type="button" className="k-button" disabled={current?.busy} onClick={() => update()}>Read driver state</button>
            <button type="button" className="k-button" disabled={driversBlocked} onClick={() => update('driver', 1)}>Sleep drivers</button>
            <button type="button" className="k-button" disabled={driversBlocked} onClick={() => update('driver', 0)}>Wake drivers</button>
          </div>
        </>}
    </section>
    {current?.error && <p role="alert" className="conn-error">{current.error}</p>}
  </>;
}

export default function DriverSleep({ controller, isConnected, isActive = true }) {
  const shared = useContext(BoardPowerContext);
  if (shared) return <PowerControls />;
  return <BoardPowerProvider controller={controller} isConnected={isConnected} isActive={isActive}><PowerControls /></BoardPowerProvider>;
}
