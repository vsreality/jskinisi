import { BOARD_PROFILES, BOARD_PROFILE_SCHEMA_VERSION } from './board_profiles.js';
import { supportsTemperatureRead } from './temperature.js';
import { supportsImuRead } from './imu.js';

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

if (BOARD_PROFILE_SCHEMA_VERSION !== 1) throw new Error('Unsupported bundled board profile schema');
const profiles = new Map(BOARD_PROFILES.map(profile =>
  [`${profile.board.model}:${profile.board.revision}`, freeze(profile)]));

/** Select a bundled profile by the exact hardware identity returned in INIT. */
export function getBoardProfile(info) {
  if (!info || !['board_model', 'board_major', 'board_minor', 'board_patch']
    .every(field => Number.isInteger(info[field]) && info[field] >= 0 && info[field] <= 255)) return null;
  return profiles.get(`${info.board_model}:${info.board_major}.${info.board_minor}.${info.board_patch}`) ?? null;
}

/** Physical presence only; firmware may not implement commands for this sensor. */
export function hasBoardSensor(info, kind, index = 0) {
  if (!Number.isInteger(index) || index < 0 || index > 255) return false;
  const profile = getBoardProfile(info);
  return Object.hasOwn(profile?.sensors ?? {}, kind) && profile.sensors[kind].some(sensor => sensor.id === index);
}

/** A usable feature needs both known hardware and compatible firmware commands. */
export function supportsBoardSensor(info, kind, index = 0) {
  const protocolSupported = kind === 'temperature' ? supportsTemperatureRead(info)
    : kind === 'imu' ? supportsImuRead(info) : false;
  return protocolSupported && hasBoardSensor(info, kind, index);
}
