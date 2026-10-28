export const FAULT_HISTORY_LIMIT = 100;

export const initialFaultHistory = {
  entries: [], connection: null, connectionNumber: 0, lastByMotor: {}, nextId: 1,
};

export function faultHistoryReducer(state, action) {
  if (action.type === 'clear') return { ...state, entries: [], lastByMotor: {} };
  if (action.type !== 'sample') return state;
  const { connection, motorIndex, status, source, receivedAt } = action;
  const sameConnection = state.connection === connection;
  const previous = sameConnection ? state.lastByMotor[motorIndex] : null;
  const signature = JSON.stringify(status);
  if (previous === signature) return state;
  const connectionNumber = sameConnection ? state.connectionNumber : state.connectionNumber + 1;
  const entry = { id: state.nextId, connectionNumber, motorIndex, status, source, receivedAt };
  return {
    entries: [entry, ...state.entries].slice(0, FAULT_HISTORY_LIMIT),
    connection, connectionNumber,
    lastByMotor: { ...(sameConnection ? state.lastByMotor : {}), [motorIndex]: signature },
    nextId: state.nextId + 1,
  };
}
