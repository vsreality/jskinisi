import { describe, expect, it } from 'vitest';
import { usesDirectVelocityPid, velocityPidDefaults } from './velocity_tuning';

describe('velocity PID migration', () => {
  it.each([undefined, {}, { protocol_major: 2, protocol_minor: 2, protocol_patch: 9 },
    { protocol_major: 2, protocol_minor: 3, protocol_patch: 0 },
    { protocol_major: 2, protocol_minor: 3 }])('retains old defaults for earlier or unknown firmware: %j', info => {
    expect(usesDirectVelocityPid(info)).toBe(false);
    expect(velocityPidDefaults(info)).toEqual({ kp: '0.1', ki: '0', kd: '0', integralLimit: '30' });
  });
  it.each([{ protocol_major: 2, protocol_minor: 3, protocol_patch: 1 },
    { protocol_major: 2, protocol_minor: 4, protocol_patch: 0 }])('enables bounded I for direct-output firmware: %j', info => {
    expect(velocityPidDefaults(info)).toEqual({ kp: '1', ki: '1', kd: '0', integralLimit: '100' });
  });
});
