// File: useCommandAction.js
// Surface rejected ACK/ERROR responses without leaving event-handler promises unhandled.
import { useCallback, useState } from 'react';

/** Execute a UI action and expose its last controller/transport failure for an alert. */
export function useCommandAction() {
  const [commandError, setCommandError] = useState('');
  const runCommand = useCallback(async (action) => {
    try { await action(); setCommandError(''); }
    catch (error) { setCommandError(error.message || String(error)); }
  }, []);
  return [commandError, runCommand];
}
