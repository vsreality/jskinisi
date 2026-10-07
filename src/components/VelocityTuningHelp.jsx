import { usesDirectVelocityPid } from '../commands/velocity_tuning';

export default function VelocityTuningHelp({ boardInfo, ki, integralLimit }) {
  if (!usesDirectVelocityPid(boardInfo)) return <p className="section-help">
    Firmware before 2.3.1 uses different velocity PID behavior. Retune after upgrading.
  </p>;
  return <>
    <p className="section-help">Starting gains need tuning for your motor and load.
      Kp sets PWM per rad/s of error; Ki builds output over time. Integral limit is 0–100% PWM.
      Velocity gains always use radians, regardless of the Angle units setting.</p>
    {Number(ki) === 0 && <p className="section-help velocity-tuning-notice">
      Ki is zero: output will not build up while the motor is stalled. Low Kp may produce too little PWM to start moving.
    </p>}
    {Number(ki) > 0 && Number(integralLimit) === 0 && <p className="section-help velocity-tuning-notice">
      Integral limit is zero: integral action is disabled even though Ki is set.
    </p>}
  </>;
}
