// Protocol support does not imply a sensor is fitted; firmware reports availability.
export function supportsImuRead(info) {
  return info?.protocol_major === 2 && info.protocol_minor >= 5;
}
