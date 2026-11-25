import { useState } from 'react';
import { mountFields, mountPresets, mountValues, readMountDraft } from '../../commands/imu_mount';
import MountDiagram from './MountDiagram';
import './ImuMounting.css';

export default function ImuMounting({ model, platform }) {
  // Drafts belong to the board readback from which they were edited.
  const [draft, setDraft] = useState(null);
  const { mount, busy, error, applied } = model;
  const values = draft && draft.base === mount ? draft.values : mount ? mountValues(mount) : Array(6).fill('0');
  const wire = readMountDraft(values);
  const preset = mountPresets.findIndex(([, ...angles]) => angles.every((n,i) => String(n) === values[i]));
  const edit = (i, v) => setDraft({ base: mount, values: values.map((old,j) => i === j ? v : old) });
  const changed = mount && wire && (!mount.configured || mountFields.some(({ key }, i) => mount[key] !== wire[i]));
  const edited = draft && draft.base === mount && (!wire || mountFields.some(({key},i) => wire[i] !== mount[key]));
  const range = (field, i) => <label key={field.key}>{field.label}
    <input type="number" step={1/field.scale} min={-field.max} max={field.max}
      value={values[i]} onChange={event=>edit(i,event.target.value)}/></label>;
  return <section className="panel-card mount-card" aria-label="IMU mounting">
    <h2>IMU mounting</h2>
    <p className="section-help">Measure from the chassis tracking origin to the BMI088 chip. Both IMU-only and fused tracking use this installation.</p>
    <div className="mount-editor">
      <div className="mount-inputs">
        <fieldset disabled={busy || !mount}><legend>Board orientation</legend>
          <label>Orientation preset<select value={preset} onChange={event=>{
            const chosen = mountPresets[Number(event.target.value)];
            if (chosen) setDraft({ base: mount, values: [...chosen.slice(1).map(String), ...values.slice(3)] });
          }}>
            {mountPresets.map(([name],i)=><option key={name} value={i}>{name}</option>)}
            <option value="-1" disabled>Custom angles</option>
          </select></label>
          <span className="mount-unit">Angles in degrees</span>
          <div className="mount-fields">{mountFields.slice(0,3).map(range)}</div>
        </fieldset>
        <fieldset disabled={busy || !mount}><legend>Chip offset</legend>
          <span className="mount-unit">Chassis coordinates in metres</span>
          <div className="mount-fields">{mountFields.slice(3).map((field,i)=>range(field,i+3))}</div>
        </fieldset>
      </div>
      <div>{wire ? <MountDiagram values={values} platform={platform}/> : <p role="status">Enter valid angles and offsets to preview the mount. Roll and yaw accept ±180°, pitch ±90°, and each offset ±10 m. Use up to two decimal places for degrees and six for metres.</p>}</div>
    </div>
    <div className="mount-readback">
      <strong>Board readback</strong>
      {busy ? <span role="status">Reading mounting geometry…</span> : mount ? <span>{mount.configured ?
        `Configured · roll / pitch / yaw ${mountValues(mount).slice(0,3).join(' / ')}° · X / Y / Z ${mountValues(mount).slice(3).join(' / ')} m` :
        'Legacy per-mode yaw is active. Apply an installation to use the shared mount.'}</span> : <span>Geometry unavailable</span>}
    </div>
    <div className="mount-actions">
      <button type="button" className="k-button" onClick={()=>model.read(wire)} disabled={!changed || busy}>Apply mounting</button>
      <button type="button" className="k-button" onClick={()=>model.read()} disabled={busy}>Read mounting</button>
      {error ? <span role="alert">{error}</span> : edited ? <span role="status">Preview has unapplied edits.</span> :
        applied && <span role="status">Applied and verified on the board.</span>}
    </div>
    <p className="section-help">Stop and disarm before applying. Changes require fresh tracking initialization. Use Save configuration in Platform setup to restore the mount after power cycling.</p>
  </section>;
}
