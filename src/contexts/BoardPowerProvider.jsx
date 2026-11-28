import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardPowerContext } from './BoardPowerContext';
import { getDriverSleepKind, supportsBoardIdle, supportsDriverSleep } from '../commands/board_profile';
import { ErrorCode } from '../commands/kinisi_commands';

/** One read-only polling loop shared by power controls and telemetry freshness. */
export default function BoardPowerProvider({ controller, isConnected, isActive = true, children }) {
  const connection = controller?.boardInfo;
  const idleSupported = supportsBoardIdle(connection);
  const driverSupported = supportsDriverSleep(connection);
  const available = isConnected && controller?.ready && (idleSupported || driverSupported);
  const [state, setState] = useState(null);
  const operation = useRef({ id: 0, busy: false });
  const current = available && state?.controller === controller && state.connection === connection ? state : null;

  const update = useCallback(async (kind = null, requested = null, background = false) => {
    if (!available || operation.current.busy) return;
    const id = ++operation.current.id;
    operation.current.busy = true;
    setState(previous => {
      const old = previous?.controller === controller && previous.connection === connection ? previous : null;
      return { ...old, controller, connection, busy: true, transition: kind,
        epoch: (old?.epoch ?? 0) + (kind === 'board' ? 1 : 0), error: background ? old?.error : '' };
    });
    try {
      if (kind === 'board') await controller.set_board_idle(requested);
      if (kind === 'driver') await controller.set_driver_sleep(requested);
      if (operation.current.id !== id) return;
      const idle = idleSupported ? await controller.get_board_idle() : null;
      if (operation.current.id !== id) return;
      const sleeping = driverSupported ? await controller.get_driver_sleep() : null;
      if ((idleSupported && idle !== 0 && idle !== 1) || (driverSupported && sleeping !== 0 && sleeping !== 1))
        throw new Error('The board returned an invalid power state.');
      if (operation.current.id !== id) return;
      setState(previous => ({ controller, connection, idle, sleeping, busy: false,
        epoch: (previous?.epoch ?? 0) + (previous?.idle !== idle ? 1 : 0),
        error: kind && (kind === 'board' ? idle : sleeping) !== requested
          ? 'The readback differs from your request. Another connection may have changed the state; read it again before continuing.'
          : background ? previous?.error : '' }));
    } catch (error) {
      if (operation.current.id !== id) return;
      const guidance = error.code === ErrorCode.BOARD_IDLE
        ? kind === 'board'
          ? 'The board remains idle. Read board state, then explicitly retry the transition if still wanted.'
          : 'Board idle is active. Use Wake board before changing driver sleep or starting live updates.'
        : kind === 'board' && error.code === ErrorCode.INTERNAL_ERROR
          ? getDriverSleepKind(connection) === 'input_low'
            ? 'Board transition failed; idle and motion inhibition remain active. Check motor power and wiring, read board state, then explicitly retry.'
            : 'Board transition failed; idle and motion inhibition remain active. Check motor power and driver faults, then explicitly retry.'
          : kind === 'driver' && requested === 0 && error.code === ErrorCode.INTERNAL_ERROR
            ? getDriverSleepKind(connection) === 'input_low'
              ? 'Wake failed; the software inhibit remains active. Check motor power and wiring, read driver state, then retry Wake drivers.'
              : 'Wake failed; the drivers remain inhibited. Check motor power and driver faults, then retry Wake drivers.'
            : kind ? 'The requested state is not confirmed. Read power state, then retry if needed.'
              : 'Could not read power state. Check the connection and read again.';
      setState(previous => ({ controller, connection, idle: null, sleeping: null, busy: false,
        epoch: (previous?.epoch ?? 0) + 1, error: `${guidance} ${error.message || ''}` }));
    } finally { if (operation.current.id === id) operation.current.busy = false; }
  }, [available, controller, connection, idleSupported, driverSupported]);

  useEffect(() => {
    const requests = operation.current;
    if (!available || !isActive) return;
    update();
    const timer = setInterval(() => update(null, null, true), 2000);
    return () => { clearInterval(timer); requests.id++; requests.busy = false; };
  }, [available, isActive, update]);

  return <BoardPowerContext.Provider value={{ controller, available, idleSupported, driverSupported, current, update }}>
    {children}
  </BoardPowerContext.Provider>;
}
