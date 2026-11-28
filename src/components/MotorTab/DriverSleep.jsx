import { useContext } from 'react';
import { BoardPowerContext } from '../../contexts/BoardPowerContext';
import BoardPowerProvider from '../../contexts/BoardPowerProvider';
import { getDriverSleepKind } from '../../commands/board_profile';

function PowerControls() {
  const { controller, available, driverSupported, idleSupported, current, update } = useContext(BoardPowerContext);
  const inputLow = getDriverSleepKind(controller?.boardInfo) === 'input_low';
  const driversBlocked = current?.busy || (idleSupported && current?.idle !== 0);
  return <>
    <section className="control-section" aria-labelledby="boardIdleTitle">
      <h3 id="boardIdleTitle">Board idle</h3>
      {!idleSupported ? <p className="section-help">Board idle requires a supported v0.3.0 or Nano v0.3.1 board with protocol 2.18 or newer, or v0.4 with protocol 2.16 or newer.</p>
        : !available ? <p>Connect and wait for the controller to be ready.</p> : <>
          <p className="section-help">{inputLow
            ? 'Idle stops motion, inhibits motor commands, holds the DRV8870 inputs low and pauses automatic telemetry.'
            : 'Idle stops motion, sleeps the drivers and pauses automatic telemetry.'} USB and I²C communication, heartbeat, time sync and direct reads remain available. Idle keeps the USB session connected; it does not require reconnecting. The CPU can use shallow sleep between scheduled work.</p>
          <p><output aria-label="Board idle state" aria-live="polite">{current?.transition === 'board' ? 'Changing board state…'
            : current?.idle === 1 ? 'Idle — automatic telemetry paused' : current?.idle === 0 ? 'Active — board idle cleared' : 'State not verified'}</output></p>
          <p className="section-help">{inputLow
            ? 'Wake board preserves a motor inhibit that was active before idle. Otherwise it clears the inhibit while both inputs remain low until a fresh drive or explicit short brake. It does not verify physical driver wake or resume motion.'
            : 'Wake board preserves driver sleep if it was active before idle. Otherwise it verifies the drivers and leaves outputs stopped.'} Existing subscriptions resume with fresh samples; restart controllers before requesting new motion.</p>
          <div className="action-row">
            <button type="button" className="k-button" disabled={current?.busy} onClick={() => update()}>Read board state</button>
            <button type="button" className="k-button" disabled={current?.busy} onClick={() => update('board', 1)}>Enter board idle</button>
            <button type="button" className="k-button" disabled={current?.busy} onClick={() => update('board', 0)}>Wake board</button>
          </div>
        </>}
    </section>
    <section className="control-section" aria-labelledby="driverSleepTitle">
      <h3 id="driverSleepTitle">Driver sleep — all motors</h3>
      {!driverSupported ? <p className="section-help">Manual driver sleep requires a supported v0.3.0 or Nano v0.3.1 board with protocol 2.17 or newer, or v0.4 with protocol 2.15 or newer.</p>
        : !available ? <p>Connect and wait for the controller to be ready.</p> : <>
          <p className="section-help">{inputLow
            ? 'Sleep stops motion and controllers on every connection, blocks motor commands and holds both DRV8870 inputs low so the motors coast. Wake clears the software inhibit; both inputs stay low until a fresh drive or explicit short-brake request. Short brake drives both inputs high; coast returns them low. Restart controllers before requesting closed-loop motion.'
            : 'Sleep stops motion and controllers on every connection. Wake checks the retained driver settings and leaves outputs stopped. Restart controllers and send fresh motion commands when ready.'}</p>
          {inputLow && <p className="section-help">DRV8870 has no sleep-state readback. Its sleep entry can take up to 1.5 ms with both inputs low. On the first fresh drive or short brake, the silicon needs a qualifying high input of at least 5 μs, followed by up to 50 μs for wake. A cleared inhibit does not confirm that the silicon is awake.</p>}
          <p><output aria-label="Driver sleep state" aria-live="polite">{current?.sleeping === 1
            ? inputLow ? 'Inhibited — motor commands blocked' : 'Asleep — motor commands inhibited'
            : current?.sleeping === 0 ? inputLow ? 'Inhibit cleared — fresh drive or brake allowed' : 'Awake — board-wide inhibit cleared' : 'State not verified'}</output></p>
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
