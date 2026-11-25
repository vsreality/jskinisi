import { mountValues } from '../commands/imu_mount';

export default function MountReadback({ mounting }) {
  const { mount, boardCenter, busy, error } = mounting;
  const title = boardCenter ? 'PCB underside center mounting' : 'Legacy U601 mounting';
  const values = mount?.configured ? mountValues(mount) : null;
  return <section className="panel-card" aria-label={title}>
    <h2>{title}</h2>
    <p className="section-help">{boardCenter ? 'Edit the installation under Platform → IMU mounting.' :
      'Protocol 2.23 uses the U601 chip as its position reference. This view is read-only. Upgrade to protocol 2.24 or later to configure the PCB underside center.'}</p>
    {busy ? <p role="status">Reading mounting geometry…</p> : values ? <dl>
      <dt>Board orientation · roll / pitch / yaw</dt><dd>{values.slice(0,3).join(' / ')}°</dd>
      <dt>{boardCenter ? 'Tracking origin to PCB underside center' : 'Tracking origin to U601 chip'} · X / Y / Z</dt>
      <dd>{values.slice(3).join(' / ')} m</dd>
    </dl> : mount ? <p>Shared mounting is unconfigured. Each tracking mode uses its legacy yaw.</p> : null}
    {error && <p role="alert">Mounting readback unavailable. {error}</p>}
    <button type="button" className="k-button" disabled={busy} onClick={() => mounting.read()}>
      {error ? 'Retry mounting read' : 'Read mounting'}
    </button>
  </section>;
}
