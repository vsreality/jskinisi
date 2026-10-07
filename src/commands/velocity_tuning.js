// Firmware 2.3.1 changed velocity PID from accumulated to direct PWM output.
// Keep the old defaults for earlier firmware: its Ki has different behavior.
export function usesDirectVelocityPid(info) {
  return info?.protocol_major === 2 && (info.protocol_minor > 3 ||
    (info.protocol_minor === 3 && info.protocol_patch >= 1));
}

export function velocityPidDefaults(info) {
  return usesDirectVelocityPid(info)
    ? { kp: '1', ki: '1', kd: '0', integralLimit: '100' }
    : { kp: '0.1', ki: '0', kd: '0', integralLimit: '30' };
}
