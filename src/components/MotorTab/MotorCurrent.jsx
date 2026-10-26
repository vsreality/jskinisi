import { useState } from 'react';
import { ErrorCode, Topic } from '../../commands/kinisi_commands';
import { getBoardProfile, supportsMotorCurrent } from '../../commands/board_profile';
import TelemetryControl from '../TelemetryControl/TelemetryControl';

export default function MotorCurrent({ controller, motorIndex = 0, isActive = true }) {
  const [reading, setReading] = useState(null);
  const current = reading?.controller === controller && reading.motorIndex === motorIndex ? reading : null;
  const readCurrent = async () => {
    const request = { controller, motorIndex, busy: true, value: null, error: '' };
    setReading(request);
    try {
      const value = await controller.get_motor_current(motorIndex);
      if (!Number.isFinite(value) || value < 0) throw new Error('Invalid current reading.');
      setReading(active => active === request ? { ...request, busy: false, value } : active);
    } catch (error) {
      const message = error?.code === ErrorCode.SAMPLE_OUT_OF_RANGE
        ? 'The current sensor is saturated. No valid reading is available.'
        : error?.message || 'Could not read motor current.';
      setReading(active => active === request ? { ...request, busy: false, error: message } : active);
    }
  };
  if (!getBoardProfile(controller?.boardInfo)?.motor_features.some(motor => motor.id === motorIndex && motor.current_sense)) return null;
  return <section className="control-section motor-current" aria-labelledby={`motorCurrentTitle-${motorIndex}`}>
    <h3 id={`motorCurrentTitle-${motorIndex}`}>Motor {motorIndex} current</h3>
    {!supportsMotorCurrent(controller?.boardInfo, motorIndex)
      ? <p className="section-help">Update the board firmware to read motor current.</p>
      : <>
    <output aria-label={`Latest motor ${motorIndex} current`} aria-live="polite">
      {current?.value != null ? `${current.value.toFixed(3)} A` : 'No reading yet'}
    </output>
    <p className="section-help">Filtered current estimate. PWM and motor operating state affect the reading.</p>
    <button type="button" className="k-button" disabled={current?.busy} onClick={readCurrent}>
      {current?.busy ? 'Reading…' : 'Read current'}
    </button>
    {current?.error && <p className="conn-error" role="alert">{current.error}</p>}
    {isActive && <TelemetryControl controller={controller} topic={Topic.MOTOR_CURRENT} index={motorIndex} intervalMs={100}
      onSample={sample => setReading({ controller, motorIndex, value: sample.amps, busy: false, error: '' })} />}
    </>}
  </section>;
}
