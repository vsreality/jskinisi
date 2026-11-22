import { useCallback, useEffect, useRef, useState } from 'react';
import { supportsFusionExperiment } from '../../commands/board_profile';
import { FusionMode, FusionHealth, FusionFault, FusionFlag, FusionVectorKind } from '../../commands/kinisi_commands';

const label = (catalog, value) => Object.keys(catalog).find(key => catalog[key] === value) ?? `Unknown (${value})`;
const age = value => value === 0xffffffff ? 'Unavailable' : `${value} µs`;

/** Explicit, volatile comparison controls. Reads never configure or resume motion. */
export default function FusionExperiment({ controller, isConnected, isActive = true }) {
  const connection = controller?.boardInfo;
  const supported = supportsFusionExperiment(connection);
  const available = supported && isConnected && controller?.ready;
  const operation = useRef({ id: 0, busy: false });
  const [state, setState] = useState(null);
  const [yaw, setYaw] = useState('');
  const [mount, setMount] = useState(null);
  const current = available && state?.controller === controller && state.connection === connection ? state : null;
  const yawNumber = Number(yaw);
  const validMount = mount?.controller === controller && mount.connection === connection && mount.confirmed &&
    yaw.trim() !== '' && Number.isFinite(yawNumber) && Math.abs(yawNumber) <= Math.PI;

  const read = useCallback(async (mode = null) => {
    if (!available || operation.current.busy) return;
    if (mode !== null && mode !== FusionMode.LEGACY_ENCODER && !validMount) return;
    const id = ++operation.current.id;
    operation.current.busy = true;
    setState({ controller, connection, busy: true });
    try {
      if (mode !== null) await controller.set_fusion_experiment(mode, mode === FusionMode.LEGACY_ENCODER ? 0 : yawNumber);
      if (operation.current.id !== id) return;
      const configuration = await controller.get_fusion_configuration();
      if (operation.current.id !== id) return;
      const status = await controller.get_fusion_status();
      const vectors = [];
      for (const [name, kind] of Object.entries(FusionVectorKind)) {
        if (operation.current.id !== id) return;
        try { vectors.push({ name, sample: await controller.get_fusion_vector(kind) }); }
        catch (error) { vectors.push({ name, error: error.message || 'Unavailable' }); }
      }
      if (operation.current.id !== id) return;
      setState({ controller, connection, configuration, status, vectors, busy: false,
        error: mode !== null && (configuration.mode !== mode || status.mode !== mode)
          ? 'Readback differs from the request. Another connection may have changed the experiment; read again.' : '' });
    } catch (error) {
      if (operation.current.id !== id) return;
      setState({ controller, connection, busy: false, error: `${mode === null ? 'Diagnostics unavailable.' : 'Configuration is not confirmed. Stop motion, read state and explicitly retry; no target was sent.'} ${error.message || ''}` });
    } finally { if (operation.current.id === id) operation.current.busy = false; }
  }, [available, controller, connection, validMount, yawNumber]);

  // Draft edits must not trigger reads or apply configuration. A session change
  // cancels the old response and requires renewed mounting confirmation.
  const reader = useRef(read);
  useEffect(() => { reader.current = read; }, [read]);
  useEffect(() => {
    const requests = operation.current;
    if (available && isActive) reader.current();
    return () => { requests.id++; requests.busy = false; };
  }, [available, controller, connection, isActive]);

  return <section className="settings-card control-section" aria-labelledby="fusionExperimentTitle">
    <h3 id="fusionExperimentTitle">Encoder + IMU experiment</h3>
    {!available ? <p>Requires a ready v0.4.0 controller with protocol 2.19 and fusion experiment support.</p> : <>
      <p>Legacy encoder feedback remains the boot default. This volatile experiment compares one chassis correction using encoder feedback or fusion. It does not provide IMU-only control or save configuration.</p>
      <p>Stop motion and set all targets and outputs to zero before configuring. Idle initialized controllers are allowed. Configuration rejects observed encoder movement in the preceding 100 ms or a counter change since a fresh sample. Cold setup may ACK while WAITING; both experimental modes require 100 ms of observed unchanged configured counters for initial rest arming. Once armed, ordinary target updates remain accepted while moving. After a sensor fault, wait for source recovery and healthy feedback, then send a fresh target through the usual controls. Change configuration only deliberately while stopped. Nothing here starts motion.</p>
      <label htmlFor="fusionYaw">Board +X angle in chassis XY (radians, −π to π)</label>
      <input id="fusionYaw" type="number" step="any" value={yaw} onChange={event => setYaw(event.target.value)} />
      <label><input type="checkbox" checked={!!(mount?.controller === controller && mount.connection === connection && mount.confirmed)} onChange={event => setMount({ controller, connection, confirmed: event.target.checked })} /> I confirm a rigid, level mount, component side up, with the IMU at the chassis reference point.</label>
      <p>Chassis axes: forward, left, up. Yaw is counterclockwise about chassis +Z. Unsupported tilt or sensor offset invalidates this experiment.</p>
      <div className="action-row">
        <button className="k-button" type="button" disabled={current?.busy} onClick={() => read()}>Read fusion diagnostics</button>
        <button className="k-button" type="button" disabled={current?.busy} onClick={() => read(FusionMode.LEGACY_ENCODER)}>Use legacy encoder path</button>
        <button className="k-button" type="button" disabled={current?.busy || !validMount} onClick={() => read(FusionMode.ENCODER_CORRECTION)}>Enable encoder comparator</button>
        <button className="k-button" type="button" disabled={current?.busy || !validMount} onClick={() => read(FusionMode.FUSED)}>Enable fusion experiment</button>
      </div>
      {current?.busy && <p role="status">Reading experiment state…</p>}
      {current?.error && <p role="alert">{current.error}</p>}
      {current?.status && <>
        <p>Diagnostic snapshot; use Read fusion diagnostics to update. Reads never set targets or change configuration, but may enforce an expired feedback deadline, clear the live target and coast. Software health does not establish physical accuracy.</p>
        <dl>
          <dt>Configured experiment</dt><dd>{label(FusionMode, current.configuration.mode)}; mounting yaw {current.configuration.mounting_yaw_rad} rad</dd>
          <dt>Reported mode / health / fault</dt><dd>{label(FusionMode, current.status.mode)} / {label(FusionHealth, current.status.health)} / {label(FusionFault, current.status.fault)}</dd>
          <dt>Snapshot</dt><dd>Sequence {current.status.sequence}, monotonic timestamp {String(current.status.timestamp_us)} µs</dd>
          <dt>Accel / gyro / encoder ages</dt><dd>{age(current.status.accel_age_us)} / {age(current.status.gyro_age_us)} / {age(current.status.encoder_age_us)}</dd>
          <dt>Health flags</dt><dd>{Object.entries(FusionFlag).filter(([, bit]) => current.status.flags & bit).map(([name]) => name).join(', ') || 'None'}</dd>
        </dl>
        <ul>{current.vectors.map(({ name, sample, error }) => <li key={name}>{name}: {error || `${sample.x}, ${sample.y}, ${sample.z} (sequence ${sample.sequence}${sample.sequence === current.status.sequence ? ', matches status' : ', different snapshot — do not combine'})`}</li>)}</ul>
        <p>Pose: metres/metres/radians. Body twist: m/s, m/s, rad/s. Bias: m/s², m/s², rad/s. Position and heading are relative, with no absolute reference.</p>
      </>}
    </>}
  </section>;
}
