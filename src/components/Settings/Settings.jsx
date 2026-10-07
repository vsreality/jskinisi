import { useSettings } from '../../contexts/SettingsContext';
import './Settings.css';

export default function Settings() {
  const { angleUnit, setAngleUnit, storageError } = useSettings();
  return <section className="panel-card app-settings" aria-labelledby="settingsUnitsTitle">
    <h2 id="settingsUnitsTitle">Units</h2>
    <label htmlFor="appAngleUnits">Angle units</label>
    <select id="appAngleUnits" value={angleUnit} onChange={event => setAngleUnit(event.target.value)}
      aria-describedby="angleUnitsHelp">
      <option value="rad">Radians (rad, rad/s)</option>
      <option value="deg">Degrees (deg, deg/s)</option>
    </select>
    <p id="angleUnitsHelp" className="section-help">Applies to angles and angular speeds on every page, including targets, feedback and graphs. PID gains (Kp, Ki, Kd) stay unchanged.</p>
    {storageError
      ? <p className="conn-error" role="alert">Your browser could not save this setting. It will apply until you reload.</p>
      : <p className="settings-save-note">Changes save automatically in this browser.</p>}
  </section>;
}
