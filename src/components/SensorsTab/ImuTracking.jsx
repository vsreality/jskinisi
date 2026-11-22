import { useCallback, useEffect, useRef, useState } from 'react';
import { supportsImuTracking } from '../../commands/board_profile';
import { ImuTrackingAction, ImuTrackingState, ImuTrackingFault, ImuTrackingFlag, ImuTrackingVectorKind } from '../../commands/kinisi_commands';

const label = (catalog, value) => Object.keys(catalog).find(key => catalog[key] === value) ?? `Unknown (${value})`;
const age = value => value === 0xffffffff ? 'Unavailable' : `${value} µs`;
const vectorText = (name, value) => {
  const units = name === 'POSE' ? ['m', 'm', 'rad'] : name === 'TWIST' ? ['m/s', 'm/s', 'rad/s'] : ['m/s²', 'm/s²', 'rad/s'];
  return [value.x, value.y, value.z].map((number, index) => `${Number(number.toPrecision(5))} ${units[index]}`).join(', ');
};

/** Relative sensing only: no targets, control selection or automatic restart. */
export default function ImuTracking({ controller, isConnected, isActive = true }) {
  const connection = controller?.boardInfo;
  const available = isConnected && controller?.ready && supportsImuTracking(connection);
  const op = useRef({ id: 0, busy: false });
  const [result, setResult] = useState(null);
  const [yaw, setYaw] = useState('');
  const [confirmed, setConfirmed] = useState(null);
  const [poll, setPoll] = useState(false);
  const [now, setNow] = useState(() => performance.now());
  const current = available && result?.controller === controller && result.connection === connection ? result : null;
  const declared = confirmed?.controller === controller && confirmed.connection === connection;
  const validMount = declared && yaw.trim() !== '' && Number.isFinite(Number(yaw)) && Math.abs(Number(yaw)) <= Math.PI;
  const read = useCallback(async (action = null) => {
    if (!available || op.current.busy || (action !== null && action !== ImuTrackingAction.STOP && !validMount)) return;
    const id = ++op.current.id;
    op.current.busy = true;
    setResult({ controller, connection, busy: true });
    let acknowledged = false;
    try {
      if (action !== null) {
        setConfirmed(null);
        await controller.set_imu_tracking(action, action === ImuTrackingAction.STOP ? 0 : 1, action === ImuTrackingAction.STOP ? 0 : Number(yaw));
        acknowledged = true;
      }
      if (op.current.id !== id) return;
      const configuration = await controller.get_imu_tracking_configuration();
      if (op.current.id !== id) return;
      const readAt = performance.now();
      const status = await controller.get_imu_tracking_status();
      const vectors = [];
      for (const [name, kind] of Object.entries(ImuTrackingVectorKind)) {
        if (op.current.id !== id) return;
        try { vectors.push({ name, value: await controller.get_imu_tracking_vector(kind) }); }
        catch (error) { vectors.push({ name, error: error.message || 'Unavailable' }); }
      }
      if (op.current.id !== id) return;
      const remaining = Math.max(0, configuration.window_us - status.elapsed_us) / 1000;
      const lifetime = status.state === ImuTrackingState.TRACKING ? Math.min(1500, remaining) : 1500;
      setResult({ controller, connection, status, configuration, vectors, readAt, expiresAt: readAt + lifetime });
      setNow(performance.now());
    } catch (error) {
      const message = acknowledged ? 'Action acknowledged. Read diagnostics again to check the result.' :
        action === null ? 'Diagnostics unavailable.' : 'Action is not confirmed. Read state before explicitly retrying.';
      if (op.current.id === id) setResult({ controller, connection, error: `${message} ${error.message || ''}` });
    } finally { if (op.current.id === id) op.current.busy = false; }
  }, [available, controller, connection, validMount, yaw]);
  const reader = useRef(read);
  useEffect(() => { reader.current = read; }, [read]);
  useEffect(() => {
    const requests = op.current;
    if (available && isActive) reader.current();
    return () => { requests.id++; requests.busy = false; };
  }, [available, controller, connection, isActive]);
  useEffect(() => {
    if (!available || !isActive) return;
    const timer = setInterval(() => { setNow(performance.now()); if (poll) reader.current(); }, 500);
    return () => clearInterval(timer);
  }, [available, isActive, poll]);
  const deadline = current?.expiresAt;
  useEffect(() => {
    if (!isActive || deadline === undefined) return;
    const timer = setTimeout(() => setNow(performance.now()), Math.max(0, Math.ceil(deadline - performance.now())));
    return () => clearTimeout(timer);
  }, [deadline, isActive]);
  const fresh = isActive && now - current?.readAt < 1500;
  const sourceValid = current?.status?.state === ImuTrackingState.TRACKING && (current.status.flags & ImuTrackingFlag.ESTIMATE_VALID);
  const usable = fresh && sourceValid && now < deadline;
  if (!available) return <section className="panel-card"><h2>IMU-only relative tracking</h2><p>Requires a ready v0.4.0 controller with protocol 2.20 and IMU tracking support.</p></section>;
  return <section className="panel-card board-imu" aria-labelledby="imuTrackingTitle">
    <h2 id="imuTrackingTitle">IMU-only relative tracking</h2>
    <p>The one-second window begins at the first qualified estimate, even if the chassis stays still. The IMU estimates relative displacement and velocity. Starting this diagnostic leaves the selected control feedback unchanged.</p>
    <p>Start, reset and recalibrate each discard bias and pose and perform full cold calibration at a new origin. Remain truly stationary during calibration. IMU checks cannot distinguish rest from constant velocity. Faults and expiry require an explicit restart.</p>
    <label htmlFor="imuTrackingYaw">Sensor +X angle in chassis XY (radians, −π to π)</label>
    <input id="imuTrackingYaw" type="number" step="any" value={yaw} onChange={event => { setYaw(event.target.value); setConfirmed(null); }} />
    <label><input type="checkbox" checked={!!declared} onChange={event => setConfirmed(event.target.checked ? { controller, connection } : null)} /> I confirm zero velocity and a rigid, level, centered mount with sensor +Z up.</label>
    <p>Chassis axes are forward, left, up; yaw is counterclockwise about chassis +Z. Use the sensor axes, not the board outline. A backwards sensor requires π radians.</p>
    <div className="action-row">
      <button className="k-button" disabled={current?.busy} onClick={() => read()}>Read tracking diagnostics</button>
      {[['Start tracking', ImuTrackingAction.START], ['Reset relative origin', ImuTrackingAction.RESET], ['Recalibrate tracking', ImuTrackingAction.RECALIBRATE]].map(([name, action]) => <button className="k-button" key={name} disabled={current?.busy || !validMount} onClick={() => read(action)}>{name}</button>)}
      <button className="k-button" disabled={current?.busy} onClick={() => read(ImuTrackingAction.STOP)}>Stop tracking</button>
    </div>
    <label><input type="checkbox" checked={poll} onChange={event => setPoll(event.target.checked)} /> Refresh diagnostics every 500 ms while this tab is visible</label>
    {current?.busy && <p role="status">Reading tracking state…</p>}
    {current?.error && <p role="alert">{current.error}</p>}
    {current?.status && <>
      <p>{usable ? 'Tracking snapshot available' : sourceValid ? 'The board reported a valid estimate at this source timestamp. Historical sample.' : 'No valid estimate in this status'}. {fresh ? 'Recently read' : 'Cached snapshot; read again'}. Software validity does not establish physical accuracy.</p>
      <dl>
        <dt>State / fault</dt><dd>{label(ImuTrackingState, current.status.state)} / {label(ImuTrackingFault, current.status.fault)}</dd>
        <dt>Flags</dt><dd>{Object.entries(ImuTrackingFlag).filter(([,bit]) => current.status.flags & bit).map(([name]) => name).join(', ') || 'None'}</dd>
        <dt>Snapshot</dt><dd>Sequence {current.status.sequence}; joint timestamp {String(current.status.timestamp_us)} µs</dd>
        <dt>Elapsed / configured horizon</dt><dd>{current.status.elapsed_us} / {current.configuration.window_us} µs</dd>
        <dt>Accel / gyro ages</dt><dd>{age(current.status.accel_age_us)} / {age(current.status.gyro_age_us)}</dd>
        <dt>Mounting yaw</dt><dd>{current.configuration.mounting_yaw_rad} rad from sensor +X</dd>
      </dl>
      <ul>{current.vectors.map(({ name, value, error }) => <li key={name}>{name}: {error || `${vectorText(name, value)} (sequence ${value.sequence}; ${value.sequence !== current.status.sequence ? 'Different snapshot; separate historical observation, not associated with displayed status or timestamp' : usable ? 'matches tracking snapshot' : 'matches status; diagnostic only'})`}</li>)}</ul>
      <p>Pose: m, m, rad. Body twist: m/s, m/s, rad/s. Bias: m/s², m/s², rad/s. These explicit snapshots age even when display refresh is off; reads never restart tracking.</p>
    </>}
  </section>;
}
