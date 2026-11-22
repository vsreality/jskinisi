import { describe, it, expect } from 'vitest';
import { getBoardProfile, hasBoardSensor, supportsBoardSensor } from './board_profile';

const info = (minor = 4, protocol = 5) => ({ board_model: 1, board_major: 0, board_minor: minor,
  board_patch: 0, protocol_major: 2, protocol_minor: protocol, protocol_patch: 0 });

describe('bundled board profiles', () => {
  it.each([1, 2, 3, 4])('selects revision 0.%s.0 independently of protocol version', minor => {
    const profile = getBoardProfile(info(minor));
    expect(profile.board).toEqual({ model: 1, revision: `0.${minor}.0` });
    expect(profile.resources.motors).toBe(4); expect(profile.resources.encoders).toBe(minor === 1 ? 1 : 4);
    expect(profile.motor_features).toHaveLength(4);
    expect(getBoardProfile(info(minor, 1))).toBe(profile);
  });
  it('separates physical sensor presence from usable firmware support', () => {
    for (let minor = 1; minor <= 3; minor++) {
      expect(hasBoardSensor(info(minor), 'temperature')).toBe(false);
      expect(supportsBoardSensor(info(minor), 'imu')).toBe(false);
    }
    expect(hasBoardSensor(info(4, 1), 'temperature')).toBe(true);
    expect(hasBoardSensor(info(4, 1), 'imu')).toBe(true);
    expect(supportsBoardSensor(info(4, 3), 'temperature')).toBe(false);
    expect(supportsBoardSensor(info(4, 4), 'temperature')).toBe(true);
    expect(supportsBoardSensor(info(4, 4), 'imu')).toBe(false);
    expect(supportsBoardSensor(info(4, 5), 'imu')).toBe(true);
    expect(supportsBoardSensor({ ...info(), protocol_major: 3 }, 'imu')).toBe(false);
  });
  it('selects Nano by its own exact identity without inheriting v0.4 features', () => {
    const nano = { ...info(3, 17), board_patch: 1 };
    const profile = getBoardProfile(nano);
    expect(profile.board).toEqual({ model: 1, revision: '0.3.1' });
    expect(profile.resources).toEqual({ motors: 4, encoders: 4, gpio: 10, status_leds: 1 });
    expect(profile.power).toEqual({ driver_sleep: true, board_idle: false });
    expect(profile.sensors).toEqual({ temperature: [], imu: [] });
    expect(hasBoardSensor(nano, 'temperature')).toBe(false);
    expect(getBoardProfile({ ...nano, board_patch: 2 })).toBeNull();
  });
  it('returns no profile for unknown or malformed identities without a fallback', () => {
    for (const value of [null, {}, { ...info(), board_model: 2 }, info(99),
      { ...info(), board_patch: 1 }, { ...info(), board_minor: '4' },
      { ...info(), board_patch: NaN }, { ...info(), board_minor: -1 }]) {
      expect(getBoardProfile(value)).toBeNull();
      expect(supportsBoardSensor(value, 'imu')).toBe(false);
    }
  });
  it('does not expose wiring or let applications mutate shared profiles', () => {
    const profile = getBoardProfile(info());
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.resources)).toBe(true);
    expect(Object.isFrozen(profile.sensors.imu[0])).toBe(true);
    expect(() => { profile.resources.motors = 99; }).toThrow();
    expect(() => { profile.sensors.imu.push({ id: 1 }); }).toThrow();
    expect(JSON.stringify(profile)).not.toMatch(/build_define|peripheral|chip_select|STM32|PC10|control_model/);
  });
  it('checks sensor indices and kinds explicitly', () => {
    for (const index of [-1, 1, 255, 256, 0.5, '0', null, NaN])
      expect(hasBoardSensor(info(), 'imu', index)).toBe(false);
    expect(hasBoardSensor(info(), 'unknown')).toBe(false);
    expect(hasBoardSensor(info(), '__proto__')).toBe(false);
    expect(supportsBoardSensor(info(), 'unknown')).toBe(false);
  });
});
