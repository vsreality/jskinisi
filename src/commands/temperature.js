// Protocol support does not imply a sensor is fitted; the board reports availability.
export function supportsTemperatureRead(info) {
  return info?.protocol_major === 2 && info.protocol_minor >= 4;
}
