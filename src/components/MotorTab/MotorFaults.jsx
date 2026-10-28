import { useContext, useEffect, useRef, useState } from 'react';
import { Topic, SubscriptionMode, SubscriptionTrigger } from '../../commands/kinisi_commands';
import { getBoardProfile, supportsMotorFaults } from '../../commands/board_profile';
import TelemetryControl from '../TelemetryControl/TelemetryControl';
import { FaultHistoryContext } from '../../contexts/FaultHistoryContext';
import { describeMotorFaults } from './motorFaultStatus';

export default function MotorFaults({ controller, motorIndex = 0, isActive = true }) {
  const [reading, setReading] = useState(null);
  const history = useContext(FaultHistoryContext);
  const scopeRef = useRef(null);
  const connection = controller?.boardInfo;
  useEffect(() => {
    scopeRef.current = { connection, motorIndex };
    return () => { scopeRef.current = null; };
  }, [controller, connection, motorIndex]);
  const current = reading?.controller === controller && reading.connection === connection && reading.motorIndex === motorIndex ? reading : null;
  const canClear = controller?.boardInfo?.protocol_major === 2 && controller.boardInfo.protocol_minor >= 10;
  const readFaults = async (clear = false) => {
    const scope = scopeRef.current;
    const request = { controller, connection, motorIndex, busy: true, clear, value: current?.value ?? null, error: '' };
    setReading(request);
    try {
      const value = await (clear ? controller.clear_motor_faults(motorIndex) : controller.get_motor_faults(motorIndex));
      if (scopeRef.current !== scope) return;
      history?.recordSample(connection, motorIndex, value, clear ? 'Clear faults result' : 'Read faults');
      setReading(active => active === request ? { ...request, busy: false, value } : active);
    } catch (error) {
      if (scopeRef.current !== scope) return;
      setReading(active => active === request ? { ...request, busy: false, error: error.message || (clear ? 'Could not clear motor faults.' : 'Could not read motor faults.') } : active);
    }
  };
  if (!getBoardProfile(controller?.boardInfo)?.motor_features.some(motor => motor.id === motorIndex && motor.fault_reporting)) return null;
  return <section className="control-section" aria-labelledby={`motorFaultsTitle-${motorIndex}`}>
    <h3 id={`motorFaultsTitle-${motorIndex}`}>Motor {motorIndex} faults</h3>
    {!supportsMotorFaults(controller?.boardInfo, motorIndex)
      ? <p className="section-help">Update the board firmware to read motor faults.</p>
      : <>
        <p><output aria-label={`Latest motor ${motorIndex} faults`} aria-live="polite">{describeMotorFaults(current?.value)}</output></p>
        <p className="section-help">Read faults preserves the driver state. Clear faults stops the motor and clears latched flags; active conditions may remain.</p>
        <button type="button" className="k-button" disabled={current?.busy} onClick={() => readFaults()}>
          {current?.busy && !current.clear ? 'Reading…' : 'Read faults'}
        </button>
        {canClear ? <button type="button" className="k-button" disabled={current?.busy} onClick={() => readFaults(true)}>
          {current?.busy && current.clear ? 'Clearing…' : 'Clear faults'}
        </button> : <p className="section-help">Update the board firmware to clear faults separately.</p>}
        {current?.error && <p className="conn-error" role="alert">{current.error}</p>}
        {isActive && <TelemetryControl controller={controller} topic={Topic.MOTOR_FAULTS} index={motorIndex} intervalMs={100} mode={SubscriptionMode.ON_CHANGE} trigger={SubscriptionTrigger.ON_EVENT} maxSilenceMs={5000}
          onSample={sample => {
            history?.recordSample(connection, motorIndex, sample, 'Live update');
            setReading(active => active?.controller === controller && active.connection === connection && active.motorIndex === motorIndex && active.busy
              ? active : { controller, connection, motorIndex, value: sample, busy: false, error: '' });
          }} />}
      </>}
  </section>;
}
