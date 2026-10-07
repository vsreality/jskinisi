import { createContext, useContext } from 'react';

export const ANGLE_UNIT_STORAGE_KEY = 'kinisi.angleUnit';
export const SettingsContext = createContext({ angleUnit: 'rad', setAngleUnit: () => {}, storageError: false });
export const useSettings = () => useContext(SettingsContext);

// Preserve empty editable fields and avoid rounding values sent to firmware.
export function scaleInput(value, scale) {
  if (scale === 1 || String(value).trim() === '' || !Number.isFinite(Number(value))) return value;
  return String(Number(value) * scale);
}
