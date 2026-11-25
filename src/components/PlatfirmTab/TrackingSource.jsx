import { useCallback, useEffect, useRef, useState } from 'react';
import { supportsFeedbackSourceSelector, supportsFeedbackSourceHealth } from '../../commands/board_profile';
import { FeedbackSource, FeedbackSourceReason, FusionFault, ImuTrackingFault } from '../../commands/kinisi_commands';
import ImuTracking from '../SensorsTab/ImuTracking';
import TrackingHealth from './TrackingHealth';
import './TrackingSource.css';

const sources = [
  [FeedbackSource.ENCODER, 'Encoders'],
  [FeedbackSource.IMU_ONLY, 'IMU only'],
  [FeedbackSource.FUSED, 'Encoders + IMU'],
];
const sourceName = value => value === FeedbackSource.NONE ? 'None' :
  sources.find(([code]) => code === value)?.[1] ?? `Unknown (${value})`;
const enumName = (catalog, value) =>
  Object.keys(catalog).find(key => catalog[key] === value)?.replaceAll('_', ' ').toLowerCase() ?? `unknown (${value})`;
const measurement = number => Number(number.toPrecision(5)).toString();

function Vector({ title, frame, sample, units }) {
  return <div className="tracking-vector">
    <h4>{title}</h4><p>{frame}</p>
    <dl>{['X', 'Y', 'Yaw'].map((axis, i) =>
      <div key={axis}><dt>{axis}</dt><dd>{measurement([sample.x, sample.y, sample.z][i])} {units[i]}</dd></div>)}</dl>
  </div>;
}

function ConnectedTracking({ controller }) {
  const [snapshot, setSnapshot] = useState(null);
  const [mount, setMount] = useState(null);
  const [choice, setChoice] = useState('');
  const [yaw, setYaw] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [historical, setHistorical] = useState(false);
  const [showImu, setShowImu] = useState(false);
  const [previousOrigin, setPreviousOrigin] = useState(null);
  const operation = useRef({ generation: 0, pending: null, userBusy: false, expires: null, origin: null, sample: null });
  const read = useCallback(async (action = null, passive = false) => {
    const op = operation.current;
    const generation = op.generation;
    const current = () => generation === op.generation;
    if (op.userBusy || (passive && op.pending)) return;
    if (!passive) {
      op.userBusy = true;
      setBusy(true); setError(null);
      if (op.pending) await op.pending;
      if (!current()) return;
    }
    let release;
    op.pending = new Promise(resolve => { release = resolve; });
    let acknowledged = false;
    try {
      if (action) {
        setSnapshot(null);
        await action();
        if (!current()) return;
        acknowledged = true;
      }
      // The final native status may itself be delayed in transit. The request
      // start conservatively bounds the remaining life even on first delivery.
      const requestedAt = performance.now();
      const value = await controller.readFeedbackSourceSnapshot();
      if (!current()) return;
      if (value.status.requested === FeedbackSource.FUSED) {
        try {
          const config = await controller.get_feedback_fusion_mount();
          if (!current()) return;
          setMount(config);
        } catch (e) {
          if (!current()) return;
          setMount({ error: e.message || 'Mount readback unavailable' });
        }
      } else {
        setMount(null);
        setConfirmed(false);
      }
      if (op.origin !== null && op.origin !== value.status.origin_id) setPreviousOrigin(op.origin);
      op.origin = value.status.origin_id;
      setSnapshot(value);
      clearTimeout(op.expires);
      if (value.status.valid) {
        const { active, origin_id, sequence, timestamp_us, max_age_ms, age_us } = value.status;
        const identity = [active, origin_id, sequence, timestamp_us].join('/');
        const fromBoard = requestedAt + max_age_ms - age_us / 1000;
        // A repeated capture may shorten its remaining life; it cannot renew it.
        const deadline = op.sample?.identity === identity ? Math.min(op.sample.deadline, fromBoard) : fromBoard;
        op.sample = { identity, deadline };
        const remaining = deadline - performance.now();
        setHistorical(remaining <= 0);
        if (remaining > 0) op.expires = setTimeout(() => { if (current()) setHistorical(true); }, remaining);
      } else {
        op.sample = null;
        setHistorical(false);
      }
      setError(old => passive && old?.fromWrite ? old : null);
    } catch (e) {
      if (!current()) return;
      setSnapshot(null); setMount(null);
      const context = acknowledged ? 'Board acknowledged the change. Status read failed.' :
        action ? 'Change unconfirmed. Read board status before retrying. Source changes require stopped outputs and disarmed controllers.' :
        'Tracking status unavailable.';
      setError({ text: `${context} ${e.message || ''}`, fromWrite: Boolean(action) });
    } finally {
      release();
      if (current()) { op.pending = null; if (!passive) { op.userBusy = false; setBusy(false); } }
    }
  }, [controller]);
  useEffect(() => {
    const op = operation.current;
    const refresh = () => { if (!document.hidden) void read(null, true); };
    refresh();
    const interval = setInterval(refresh, 500);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      op.generation++; op.pending = null; op.userBusy = false;
      clearInterval(interval); clearTimeout(op.expires);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [read]);
  const status = snapshot?.status;
  const fused = status?.requested === FeedbackSource.FUSED;
  const imu = status?.requested === FeedbackSource.IMU_ONLY;
  const selectable = choice !== '' && status && Number(choice) !== status.requested;
  const validYaw = yaw.trim() !== '' && Number.isFinite(Number(yaw)) && Math.abs(Number(yaw)) <= Math.PI;
  const detail = status?.source_detail;
  const apply = async () => {
    await read(() => controller.set_feedback_source(Number(choice)));
  };
  const confirmMount = async () => {
    await read(() => controller.set_feedback_fusion_mount(Number(yaw)));
    setConfirmed(false);
  };
  return <>
    <p className="section-help">Choose the source for position and velocity telemetry. Stop the platform and disarm its controllers before switching. The first valid sample establishes a new relative origin.</p>
    <div className="tracking-actions">
      <label>Tracking preference
        <select value={choice} onChange={event => setChoice(event.target.value)} disabled={busy}>
          <option value="">Choose a source</option>
          {sources.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </label>
      <button className="k-button" type="button" disabled={busy || !selectable} onClick={apply}>Apply source</button>
      <button className="k-button" type="button" disabled={busy} onClick={() => read()}>Read board status</button>
    </div>
    {error && <p role="alert" className="conn-error">{error.text}</p>}
    {!status && !error && <p role="status">Reading tracking source…</p>}
    {status && <>
      <dl className="tracking-status">
        <div><dt>Requested</dt><dd>{sourceName(status.requested)}</dd></div>
        <div><dt>Active at board read</dt><dd>{sourceName(status.active)}</dd></div>
        <div><dt>Validity at board read</dt><dd>{status.valid ? 'Valid' : 'Unavailable'}</dd></div>
        <div><dt>Board reason</dt><dd>{enumName(FeedbackSourceReason, status.reason)}</dd></div>
        <div><dt>Sample age at read</dt><dd>{status.age_us === 0xffffffff ? 'Unavailable' : `${status.age_us} µs`}</dd></div>
        <div><dt>Board freshness limit</dt><dd>{status.max_age_ms ? `${status.max_age_ms} ms` : 'Unavailable'}</dd></div>
        <div><dt>Source timestamp</dt><dd>{status.timestamp_us ? `${status.timestamp_us} µs` : 'Unavailable'}</dd></div>
        <div><dt>Source sequence</dt><dd>{status.sequence}</dd></div>
        <div><dt>Board origin ID</dt><dd>{status.origin_id}</dd></div>
      </dl>
      {previousOrigin !== null && <p>Origin changed from {previousOrigin} to {status.origin_id}. Earlier coordinates belong to the prior frame.</p>}
      {detail !== 0 && <p>Producer detail {imu ? enumName(ImuTrackingFault, detail) : fused ? enumName(FusionFault, detail) : detail} ({detail})</p>}
      {historical && <p role="status">Historical readback. This sample has reached the board’s freshness limit.</p>}
      {Boolean(status.valid && snapshot.pose && snapshot.twist) && <div className="tracking-vectors">
          <Vector title={historical ? 'Historical relative pose' : 'Relative pose'} frame="World axes at this board origin" units={['m','m','rad']} sample={snapshot.pose} />
          <Vector title={historical ? 'Historical body twist' : 'Body twist'} frame="Current chassis axes" units={['m/s','m/s','rad/s']} sample={snapshot.twist} />
        </div>}
      <p className="section-help">+X forward, +Y left, yaw counterclockwise. Compare positions within one origin and board boot.</p>
    </>}
    {supportsFeedbackSourceHealth(controller.boardInfo) && <TrackingHealth controller={controller} />}
    {fused && <fieldset className="tracking-mount"><legend>Passive fused tracking</legend>
      <p>Use initialized platform geometry and running odometry. Enter the board +X direction relative to chassis forward, positive counterclockwise. Confirm the board mount after each restart. Keep the platform still for calibration.</p>
      {mount?.error ? <p role="alert">Mount readback unavailable. {mount.error}</p> :
        mount && <p>Board mounting declaration {mount.confirmed ? `confirmed at ${mount.mounting_yaw_rad} rad` : 'unconfirmed'}</p>}
      <label>Board +X angle in chassis XY (radians)
        <input type="number" step="any" min={-Math.PI} max={Math.PI} value={yaw} onChange={event => { setYaw(event.target.value); setConfirmed(false); }} /></label>
      <label><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> I confirm a rigid, level, centered mount with board +Z up.</label>
      <button className="k-button" disabled={busy || !confirmed || !validYaw} type="button" onClick={confirmMount}>Confirm fused mount</button>
    </fieldset>}
    {imu && <>
      <p>IMU-only tracking requires a stationary cold start and expires after one second of tracking. Start a new window explicitly for each measurement.</p>
      <button className="k-button" type="button" aria-expanded={showImu} onClick={() => setShowImu(!showImu)}>IMU tracking controls</button>
      {showImu && <ImuTracking controller={controller} isConnected />}
    </>}
    <p className="section-help">To restore this preference at startup, <a href="#configurationSaveTitle">save the running board configuration</a>. Restore keeps motors stopped and requires a fresh origin and any required producer setup.</p>
  </>;
}

export default function TrackingSource({ controller, isConnected, isActive = true }) {
  const connection = controller?.boardInfo;
  const [session, setSession] = useState({ controller, connection, number: 0 });
  if (session.controller !== controller || session.connection !== connection)
    setSession({ controller, connection, number: session.number + 1 });
  const available = isConnected && controller?.ready && supportsFeedbackSourceSelector(connection);
  return <section className="panel-card tracking-source" aria-labelledby="trackingSourceTitle">
    <h2 id="trackingSourceTitle">Position and velocity tracking</h2>
    {available ? isActive && <ConnectedTracking key={session.number} controller={controller} /> :
      <p className="section-help">Source selection requires a ready Kinisi v0.4.0 board with tracking-source support and protocol 2.21 or newer.</p>}
  </section>;
}
