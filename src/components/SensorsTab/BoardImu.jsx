import { useState } from 'react';
import { ErrorCode } from '../../commands/kinisi_commands';
import { supportsBoardSensor } from '../../commands/board_profile';

const axes = ['x', 'y', 'z'];
const measurements = [
  { field: 'acceleration', label: 'Acceleration', unit: 'm/s²' },
  { field: 'angular_velocity', label: 'Angular velocity', unit: 'rad/s' },
];

function describeError(error) {
  if (error?.code === ErrorCode.SENSOR_NOT_AVAILABLE) return 'This board has no IMU sensor.';
  if (error?.code === ErrorCode.SAMPLE_NOT_AVAILABLE) return 'IMU is not ready yet. Try again shortly.';
  if (error?.code === ErrorCode.INTERNAL_ERROR) return 'Could not read the IMU sensor. Try again.';
  return error?.message || 'Could not read the IMU sensor.';
}

export default function BoardImu({ controller, sensorIndex = 0 }) {
  const [reading, setReading] = useState(null);
  const current = reading?.controller === controller && reading.sensorIndex === sensorIndex ? reading : null;

  const readImu = async () => {
    const request = { controller, sensorIndex, busy: true, value: null, error: '' };
    setReading(request);
    try {
      const value = await controller.get_imu(sensorIndex);
      if (!measurements.every(({ field }) => axes.every(axis => Number.isFinite(value?.[`${field}_${axis}`]))))
        throw new Error('Invalid IMU reading. Try again.');
      setReading(active => active === request ? { ...request, busy: false, value } : active);
    } catch (error) {
      setReading(active => active === request ? { ...request, busy: false, error: describeError(error) } : active);
    }
  };

  if (!supportsBoardSensor(controller?.boardInfo, 'imu', sensorIndex)) return null;
  return <section className="panel-card board-imu" aria-labelledby={`boardImuTitle-${sensorIndex}`}>
    <h2 id={`boardImuTitle-${sensorIndex}`}>Motion sensor (IMU{sensorIndex ? ` ${sensorIndex}` : ''})</h2>
    <p className="section-help">Acceleration includes gravity. Values use the sensor’s X, Y and Z axes.</p>
    <div className="imu-readings" aria-live="polite">
      {current?.value ? measurements.map(({ field, label, unit }) =>
        <div key={field} className="imu-measurement">
          <h3>{label} <span>({unit})</span></h3>
          <dl>{axes.map(axis => <div key={axis}>
            <dt>{axis.toUpperCase()}</dt>
            <dd><output aria-label={`${label} ${axis.toUpperCase()}${sensorIndex ? ` sensor ${sensorIndex}` : ''}`}>{current.value[`${field}_${axis}`].toFixed(3)}</output></dd>
          </div>)}</dl>
        </div>) : <p>No reading yet</p>}
    </div>
    <button type="button" className="k-button" disabled={current?.busy} onClick={readImu}>
      {current?.busy ? 'Reading IMU…' : 'Read IMU'}
    </button>
    {current?.error && <p className="conn-error" role="alert">{current.error}</p>}
  </section>;
}
