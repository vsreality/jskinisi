import { useState } from 'react';
import { getPwmFrequencyOptions, supportsPwmFrequency } from '../../commands/board_profile';

export default function PwmFrequency({ controller }) {
  const [state, setState] = useState(null);
  const connection = controller?.boardInfo;
  const options = getPwmFrequencyOptions(connection);
  const current = state?.controller === controller && state.connection === connection ? state : null;
  if (!options) return null;
  const update = async (apply) => {
    const request = { ...current, controller, connection, busy: true, error: '', applied: false };
    setState(request);
    try {
      const value = await (apply ? controller.set_pwm_frequency(current.draft) : controller.get_pwm_frequency());
      if (!options.supported_hz.includes(value)) throw new Error('Board returned an unsupported PWM frequency.');
      setState(active => active === request ? { ...request, busy: false, value, draft: value, applied: apply } : active);
    } catch (error) {
      setState(active => active === request ? { ...request, busy: false, value: null, error: error.message || 'Could not verify PWM frequency.' } : active);
    }
  };
  return <section className="control-section" aria-labelledby="pwmFrequencyTitle">
    <h3 id="pwmFrequencyTitle">PWM frequency — all motors</h3>
    {!supportsPwmFrequency(connection) ? <p className="section-help">Update the board firmware to configure PWM frequency.</p> : <>
      <p className="section-help">Applying a frequency stops all motors and controllers. Reboot restores {options.default_hz / 1000} kHz.</p>
      <p><output aria-label="Applied PWM frequency" aria-live="polite">{current?.value ? `${current.value / 1000} kHz` : 'No verified setting'}</output></p>
      <button type="button" className="k-button" disabled={current?.busy} onClick={() => update(false)}>Read PWM frequency</button>
      {current?.value && <>
        <label>Frequency
          <select value={current.draft} disabled={current.busy} onChange={event => setState({ ...current, draft: Number(event.target.value), applied: false })}>
            {options.supported_hz.map(value => <option key={value} value={value}>{value / 1000} kHz</option>)}
          </select>
        </label>
        <button type="button" className="k-button" disabled={current.busy} onClick={() => update(true)}>Apply PWM frequency</button>
      </>}
      {current?.applied && <p role="status">PWM frequency applied. All motors remain stopped.</p>}
      {current?.error && <p role="alert" className="conn-error">{current.error}</p>}
    </>}
  </section>;
}
