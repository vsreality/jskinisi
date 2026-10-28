import { useState } from 'react';
import { getMotorCurrentLimitOptions, supportsMotorCurrentLimit } from '../../commands/board_profile';

export default function MotorCurrentLimit({ controller, motorIndex = 0 }) {
  const [state, setState] = useState(null);
  const connection = controller?.boardInfo;
  const current = state?.controller === controller && state.connection === connection && state.motorIndex === motorIndex ? state : null;
  const options = getMotorCurrentLimitOptions(controller?.boardInfo, motorIndex);
  if (!options) return null;
  const supported = supportsMotorCurrentLimit(controller?.boardInfo, motorIndex);
  const update = async (apply) => {
    const request = { ...current, controller, connection, motorIndex, busy: true, error: '', applied: false };
    setState(request);
    try {
      const value = await (apply
        ? controller.set_motor_current_limit(motorIndex, current.draft.enabled, current.draft.threshold_ma)
        : controller.get_motor_current_limit(motorIndex));
      setState(active => active === request ? { ...request, busy: false, value, draft: { ...value }, applied: apply } : active);
    } catch (error) {
      setState(active => active === request ? { ...request, busy: false, value: null, error: error.message || 'Could not verify the current-limit setting.' } : active);
    }
  };
  const change = (field, value) => setState({ ...current, draft: { ...current.draft, [field]: value }, applied: false });
  return <section className="control-section" aria-labelledby={`currentLimitTitle-${motorIndex}`}>
    <h3 id={`currentLimitTitle-${motorIndex}`}>Motor {motorIndex} current limit</h3>
    {!supported ? <p className="section-help">Update the board firmware to configure current limits.</p> : <>
      <p className="section-help">Initialize the motor, then read its setting. Applying a limit stops the motor. Motor reinitialization restores the board default.</p>
      <p><output aria-label={`Applied motor ${motorIndex} current limit`} aria-live="polite">
        {current?.value ? `${current.value.enabled ? 'Enabled' : 'Disabled'} · ${current.value.threshold_ma} mA` : 'No verified setting'}
      </output></p>
      <button type="button" className="k-button" disabled={current?.busy} onClick={() => update(false)}>Read setting</button>
      {current?.value && <>
        <label>Current regulation
          <input type="checkbox" checked={current.draft.enabled} disabled={current.busy || (!options.can_disable && current.draft.enabled)}
            onChange={event => change('enabled', event.target.checked)} />
        </label>
        <label>Current threshold
          <select value={current.draft.threshold_ma} disabled={current.busy}
            onChange={event => change('threshold_ma', Number(event.target.value))}>
            {options.supported_thresholds_ma.map(value => <option key={value} value={value}>{value} mA</option>)}
          </select>
        </label>
        <button type="button" className="k-button" disabled={current.busy} onClick={() => update(true)}>Apply current limit</button>
      </>}
      {current?.applied && <p role="status">Current limit applied. Motor remains stopped.</p>}
      {current?.error && <p className="conn-error" role="alert">{current.error}</p>}
    </>}
  </section>;
}
