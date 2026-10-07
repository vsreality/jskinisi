import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import { supportsPositionPidControl } from '../../commands/position_control';
import './PositionControl.css';
import PositionChart from './PositionChart';
import { useSettings } from '../../contexts/SettingsContext';

const motorFields = [
  ['kp', 'Position Kp (1/s)', '2'],
  ['max_speed', 'Maximum speed (rad/s)', '1'],
  ['tolerance', 'Position tolerance (rad)', '0.02'],
  ['ki', 'Position Ki (1/s²)', '0'],
  ['kd', 'Position Kd', '0'],
  ['integral_limit', 'Integral limit (rad/s)', '1'],
];
const platformFields = [
  ['linear_kp', 'Translation Kp (1/s)', '1'],
  ['angular_kp', 'Heading Kp (1/s)', '2'],
  ['max_linear_speed', 'Maximum translation speed (m/s)', '0.2'],
  ['max_angular_speed', 'Maximum rotation speed (rad/s)', '0.5'],
  ['position_tolerance', 'Position tolerance (m)', '0.01'],
  ['heading_tolerance', 'Heading tolerance (rad)', '0.03'],
  ['linear_ki', 'Translation Ki (1/s²)', '0'],
  ['linear_kd', 'Translation Kd', '0'],
  ['linear_integral_limit', 'Translation integral limit (m/s)', '0.2'],
  ['angular_ki', 'Heading Ki (1/s²)', '0'],
  ['angular_kd', 'Heading Kd', '0'],
  ['angular_integral_limit', 'Heading integral limit (rad/s)', '0.5'],
];
const angularFields = new Set(['max_speed', 'tolerance', 'max_angular_speed', 'heading_tolerance', 'position', 't', 'integral_limit', 'angular_integral_limit']);
const isGain = key => /(^|_)(kp|ki|kd)$/.test(key);

// Parents remount on controller changes or commands that invalidate position setup.
export default function PositionControl({ platform = false, motorIndex = 0,
  velocityReady, keyboardEnabled = false, onOdometryChange }) {
  const { angleUnit: pageAngleUnit } = useSettings();
  const { controller, isConnected } = useContext(ControllerContext);
  const fields = platform ? platformFields : motorFields;
  const [settings, setSettings] = useState(() => Object.fromEntries(fields.map(([key, , value]) => [key, value])));
  const [target, setTarget] = useState(platform ? { x: '0', y: '0', t: '0' } : { position: '0' });
  const [initialized, setInitialized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [sample, setSample] = useState(null);
  const [samples, setSamples] = useState([]);
  const [liveGraph, setLiveGraph] = useState(true);
  const [graphError, setGraphError] = useState('');
  const acceptedTarget = useRef(null);
  const sampleGeneration = useRef(0);
  const [angleUnit, setAngleUnit] = useState('rad');
  const radiansPerUnit = angleUnit === 'deg' ? Math.PI / 180 : 1;
  const unitLabel = label => label.replace('rad', angleUnit);
  const changeAngleUnit = nextUnit => {
    const factor = radiansPerUnit / (nextUnit === 'deg' ? Math.PI / 180 : 1);
    const convert = values => Object.fromEntries(Object.entries(values).map(([key, value]) => [key,
      angularFields.has(key) && String(value).trim() !== '' && Number.isFinite(Number(value))
        ? String(Number(value) * factor) : value]));
    setSettings(convert);
    setTarget(convert);
    setAngleUnit(nextUnit);
  };
  // Convert editable values when the page changes units, without remounting
  // the controller or clearing its initialization and graph history.
  if (pageAngleUnit !== undefined && pageAngleUnit !== angleUnit) {
    changeAngleUnit(pageAngleUnit);
  }
  const supported = supportsPositionPidControl(controller?.boardInfo);
  const enabled = isConnected && supported && velocityReady && !keyboardEnabled;
  const prefix = platform ? 'platformPosition' : 'motorPosition';
  const targetFields = platform ? [['x', 'Target X (m)'], ['y', 'Target Y (m)'], ['t', 'Target heading (rad)']] : [['position', 'Target position (rad)']];

  const recordSample = useCallback((value, time, targetAtRead) => {
    const pose = platform ? value : { position: value };
    const keys = platform ? ['x', 'y', 't'] : ['position'];
    if (!keys.every(key => Number.isFinite(pose?.[key]))) throw new Error('Invalid position sample.');
    setSample(value);
    setSamples(previous => [...previous, { value: pose, target: targetAtRead, time }].slice(-120));
  }, [platform]);
  useEffect(() => {
    if (!enabled || !initialized || !liveGraph || busy) return;
    let active = true;
    let timer;
    const poll = async () => {
      const targetAtRead = acceptedTarget.current;
      const time = Date.now();
      try {
        const value = platform ? await controller.get_platform_odometry()
          : await controller.get_motor_position(Number(motorIndex));
        if (!active) return;
        recordSample(value, time, targetAtRead);
        timer = setTimeout(poll, 500);
      } catch (failure) {
        if (!active) return;
        setGraphError(failure.message || String(failure));
        setLiveGraph(false);
      }
    };
    // Serialize reads and discard late replies after stop, reset or disconnect.
    timer = setTimeout(poll, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [enabled, initialized, liveGraph, busy, controller, motorIndex, platform, recordSample]);

  const clearPositionHistory = () => {
    sampleGeneration.current += 1;
    acceptedTarget.current = null;
    setSamples([]);
    setGraphError('');
  };

  const number = (value) => {
    if (String(value).trim() === '' || !Number.isFinite(Number(value))) throw new Error('Enter a finite number in every field.');
    return Number(value);
  };
  const commandValue = (key, value) => number(value) * (angularFields.has(key) ? radiansPerUnit : 1);
  const run = async (action) => {
    setBusy(true); setError(''); setStatus('');
    try { await action(); }
    catch (failure) {
      if (failure.code === 14 || failure.code === 15) setInitialized(false);
      setError(failure.message || String(failure));
    } finally { setBusy(false); }
  };
  const initialize = async () => {
    const values = fields.map(([key]) => commandValue(key, settings[key]));
    fields.forEach(([key], i) => {
      if (key.includes('kp') || key.startsWith('max_') ? values[i] <= 0 : values[i] < 0)
        throw new Error('Kp and speed limits must be positive; Ki, Kd, integral limits and tolerances must be nonnegative.');
    });
    if (platform) {
      await controller.initialize_platform_position_pid_controller(...values);
      onOdometryChange?.(null);
    } else await controller.initialize_motor_position_pid_controller(Number(motorIndex), ...values);
    clearPositionHistory();
    setInitialized(true); setSample(null);
    setStatus(platform ? 'Position controller ready. Wait for fresh odometry before setting a target.' : 'Position controller ready. Current position is zero.');
  };
  const setPosition = async () => {
    const values = targetFields.map(([key]) => commandValue(key, target[key]));
    if (platform) await controller.set_platform_position(...values);
    else await controller.set_motor_position(Number(motorIndex), ...values);
    acceptedTarget.current = Object.fromEntries(targetFields.map(([key], i) => [key, values[i]]));
    setStatus('Position target accepted.');
  };
  const reset = async () => {
    if (platform) { await controller.reset_platform_position(); onOdometryChange?.(null); }
    else await controller.reset_motor_position(Number(motorIndex));
    clearPositionHistory();
    setTarget(Object.fromEntries(targetFields.map(([key]) => [key, '0'])));
    setSample(null);
    setStatus(platform ? 'Position reset. Wait for fresh odometry before setting a target.' : 'Position and target reset to zero.');
  };
  const read = async () => {
    const generation = sampleGeneration.current;
    const time = Date.now();
    const targetAtRead = acceptedTarget.current;
    const value = platform ? await controller.get_platform_odometry() : await controller.get_motor_position(Number(motorIndex));
    if (generation !== sampleGeneration.current) return;
    recordSample(value, time, targetAtRead);
    if (platform) onOdometryChange?.(value);
  };

  return <div className="position-workspace"><fieldset className="settings-card position-control">
    <legend>2. Position control</legend>
    <p className="position-tuning-note">{platform
      ? 'Tune translation and heading PID separately from the wheel velocity PID.'
      : 'Tune position Kp, Ki and Kd separately from the velocity PID.'} Set Ki or Kd to zero to disable that term.</p>
    <p className={`position-prerequisite${velocityReady ? ' is-ready' : ''}`}>
      {velocityReady ? 'Velocity controller initialized' : 'Step 1 required: initialize velocity control'}
    </p>
    <p className="position-origin-help">{platform
      ? `Absolute X/Y in meters and heading in ${angleUnit === 'deg' ? 'degrees' : 'radians'}, relative to the odometry origin.`
      : `Continuous ${angleUnit === 'deg' ? 'degrees' : 'radians'} from the last position initialization or reset. One turn = ${angleUnit === 'deg' ? '360 deg' : '2π rad'}.`}</p>
    {!supported && <p>Position PID requires firmware protocol 2.3 or newer.</p>}
    {!velocityReady && <p>Initialize the velocity controller first.</p>}
    {keyboardEnabled && <p>Turn off keyboard driving before using position control.</p>}
    <fieldset disabled={!enabled || busy} className="position-fields">
      <h3>Position tuning</h3>
      <div className="position-setting-grid position-gain-grid">
      {fields.filter(([key]) => isGain(key)).sort(([a], [b]) => {
        const order = platform ? ['linear_kp', 'linear_ki', 'linear_kd', 'angular_kp', 'angular_ki', 'angular_kd'] : ['kp', 'ki', 'kd'];
        return order.indexOf(a) - order.indexOf(b);
      }).map(([key, label]) => <label key={key} htmlFor={`${prefix}-${key}`}>
        {label}<input id={`${prefix}-${key}`} type="number" step="any" value={settings[key]}
          onChange={e => setSettings({ ...settings, [key]: e.target.value })} />
      </label>)}
      </div>
      <h3>Limits &amp; tolerance</h3>
      <div className="position-setting-grid">
      {fields.filter(([key]) => !isGain(key)).map(([key, label]) => <label key={key} htmlFor={`${prefix}-${key}`}>
        {unitLabel(label)}<input id={`${prefix}-${key}`} type="number" step="any" min="0" value={settings[key]}
          onChange={e => setSettings({ ...settings, [key]: e.target.value })} />
      </label>)}
      </div>
      <button className="k-button k-button-primary position-initialize" onClick={() => run(initialize)}>Initialize position controller</button>
      <fieldset disabled={!initialized} className="position-fields position-target">
        <h3>Position target</h3>
        <div className="position-target-grid">
        {targetFields.map(([key, label]) => <label key={key} htmlFor={`${prefix}-${key}`}>
          {unitLabel(label)}<input id={`${prefix}-${key}`} type="number" step="any" value={target[key]}
            onChange={e => setTarget({ ...target, [key]: e.target.value })} />
        </label>)}
        </div>
        <button className="k-button" onClick={() => run(setPosition)}>Set position</button>
        <div className="position-actions">
          <button className="k-button" onClick={() => run(reset)}>Reset position to zero</button>
          <button className="k-button" onClick={() => run(read)}>Read position</button>
        </div>
      </fieldset>
    </fieldset>
    {sample !== null && <output aria-label="Current position">{platform
      ? `X ${sample.x.toFixed(3)} m · Y ${sample.y.toFixed(3)} m · Heading ${(sample.t / radiansPerUnit).toFixed(3)} ${angleUnit}`
      : `${(sample / radiansPerUnit).toFixed(4)} ${angleUnit}`}</output>}
    {status && <p role="status">{status}</p>}
    {error && <p className="conn-error" role="alert">{error}</p>}
    <p>Reset changes the origin and clears the target. Use the existing stop or brake controls to stop motion.</p>
  </fieldset>
    <section className="position-chart" aria-label="Position response">
      <div className="position-chart-heading"><h3>Position response</h3>
      <label><input type="checkbox" checked={liveGraph} onChange={e => {
        setLiveGraph(e.target.checked); setGraphError('');
      }} /> Live position graph</label></div>
      <p>Measured position and last accepted target · 0.5 s updates · latest 120 samples</p>
      {samples.length === 0 && <p>No position samples yet.</p>}
      {graphError && <p role="alert">Position graph paused: {graphError}. Toggle live graph to retry.</p>}
      <PositionChart samples={samples} platform={platform} angleUnit={angleUnit} />
    </section>
  </div>;
}
