const labels = {
  overtemperature_warning: 'Temperature warning',
  undervoltage: 'Supply undervoltage',
  charge_pump_undervoltage: 'Charge-pump undervoltage',
  overcurrent: 'Overcurrent',
  overtemperature_shutdown: 'Thermal shutdown',
  open_load: 'Open load reported',
  current_regulation: 'Current regulation active',
};

export function describeMotorFaults(status) {
  if (!status) return 'No reading yet';
  if (!status.status_valid) return status.sleep_requested
    ? 'Driver asleep. Diagnostic registers are unavailable.'
    : 'Driver status unavailable. Possible causes include missing motor power, a driver communication failure, or a faulty driver.';
  const reported = Object.entries(labels).filter(([key]) => status[key]).map(([, label]) => label);
  if (status.fault_active) reported.unshift('Driver fault asserted');
  return reported.length ? reported.join('; ') : 'No reported faults';
}

// Ignore timestamps and unknown diagnostic bits when comparing received states.
export function motorFaultSnapshot(status) {
  const valid = !!status.status_valid;
  return {
    sleep_requested: !!status.sleep_requested,
    status_valid: valid,
    fault_active: valid && !!status.fault_active,
    ...Object.fromEntries(Object.keys(labels).map(key => [key, valid && !!status[key]])),
  };
}
