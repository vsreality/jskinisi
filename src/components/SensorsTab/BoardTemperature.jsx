import { useState } from 'react';
import { ErrorCode, Topic } from '../../commands/kinisi_commands';
import TelemetryControl from '../TelemetryControl/TelemetryControl';
import { supportsBoardSensor } from '../../commands/board_profile';

function describeError(error) {
  if (error?.code === ErrorCode.SENSOR_NOT_AVAILABLE) return 'This board has no temperature sensor.';
  if (error?.code === ErrorCode.SAMPLE_NOT_AVAILABLE) return 'Temperature is not ready yet. Try again shortly.';
  if (error?.code === ErrorCode.INTERNAL_ERROR) return 'Could not read the temperature sensor. Try again.';
  return error?.message || 'Could not read board temperature.';
}

export default function BoardTemperature({ controller, sensorIndex = 0, isActive = true }) {
  const [reading, setReading] = useState(null);
  const current = reading?.controller === controller && reading.sensorIndex === sensorIndex ? reading : null;

  const readTemperature = async () => {
    const request = { controller, sensorIndex, busy: true, value: null, error: '' };
    setReading(request);
    try {
      const value = await controller.get_temperature(sensorIndex);
      if (!Number.isFinite(value)) throw new Error('Invalid temperature reading. Try again.');
      setReading(active => active === request ? { ...request, busy: false, value } : active);
    } catch (error) {
      setReading(active => active === request ? { ...request, busy: false, error: describeError(error) } : active);
    }
  };

  if (!supportsBoardSensor(controller?.boardInfo, 'temperature', sensorIndex)) return null;
  return <section className="panel-card board-temperature" aria-labelledby={`boardTemperatureTitle-${sensorIndex}`}>
    <h2 id={`boardTemperatureTitle-${sensorIndex}`}>Board temperature{sensorIndex ? ` ${sensorIndex}` : ''}</h2>
    <output aria-label={`Latest board temperature${sensorIndex ? ` ${sensorIndex}` : ''}`} aria-live="polite">
      {current?.value != null ? `${current.value.toFixed(2)} °C` : 'No reading yet'}
    </output>
    <button type="button" className="k-button" disabled={current?.busy} onClick={readTemperature}>
      {current?.busy ? 'Reading…' : 'Read temperature'}
    </button>
    {current?.error && <p className="conn-error" role="alert">{current.error}</p>}
    {isActive && <TelemetryControl controller={controller} topic={Topic.TEMPERATURE} index={sensorIndex} intervalMs={1000}
      onSample={sample => setReading({ controller, sensorIndex, value: sample.celsius, busy: false, error: '' })} />}
  </section>;
}
