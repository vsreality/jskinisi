import { useEffect, useState } from 'react';
import { ANGLE_UNIT_STORAGE_KEY, SettingsContext } from './SettingsContext';

const validUnit = value => value === 'deg' || value === 'rad';
function readUnit() {
  try {
    const value = localStorage.getItem(ANGLE_UNIT_STORAGE_KEY);
    return validUnit(value) ? value : 'rad';
  } catch { return 'rad'; }
}

export default function SettingsProvider({ children }) {
  const [angleUnit, updateAngleUnit] = useState(readUnit);
  const [storageError, setStorageError] = useState(false);
  const setAngleUnit = value => {
    if (!validUnit(value)) return;
    updateAngleUnit(value);
    try {
      localStorage.setItem(ANGLE_UNIT_STORAGE_KEY, value);
      setStorageError(false);
    } catch { setStorageError(true); }
  };

  useEffect(() => {
    const onStorage = event => {
      if (event.storageArea !== localStorage) return;
      if (event.key === ANGLE_UNIT_STORAGE_KEY || event.key === null) {
        updateAngleUnit(validUnit(event.newValue) ? event.newValue : 'rad');
        setStorageError(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return <SettingsContext.Provider value={{ angleUnit, setAngleUnit, storageError }}>
    {children}
  </SettingsContext.Provider>;
}
