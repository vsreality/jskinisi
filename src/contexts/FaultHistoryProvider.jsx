import { useCallback, useMemo, useReducer } from 'react';
import { FaultHistoryContext } from './FaultHistoryContext';
import { faultHistoryReducer, initialFaultHistory } from './faultHistory';
import { motorFaultSnapshot } from '../components/MotorTab/motorFaultStatus';

export default function FaultHistoryProvider({ children }) {
  const [state, dispatch] = useReducer(faultHistoryReducer, initialFaultHistory);
  const recordSample = useCallback((connection, motorIndex, value, source) => {
    dispatch({ type: 'sample', connection, motorIndex, status: motorFaultSnapshot(value), source, receivedAt: Date.now() });
  }, []);
  const clearHistory = useCallback(() => dispatch({ type: 'clear' }), []);
  const value = useMemo(() => ({ entries: state.entries, recordSample, clearHistory }), [state.entries, recordSample, clearHistory]);
  return <FaultHistoryContext.Provider value={value}>{children}</FaultHistoryContext.Provider>;
}
