import { useCallback, useEffect, useRef, useState } from 'react';
import { getBoardProfile, supportsBoardMounting, supportsImuMounting } from '../commands/board_profile';
import { mountFields } from '../commands/imu_mount';
import { ErrorCode } from '../commands/kinisi_commands';

export default function useImuMount(controller, active) {
  const connection = controller?.boardInfo;
  const supported = supportsImuMounting(connection);
  const boardCenter = supportsBoardMounting(connection);
  const enabled = supported && controller?.ready && active;
  const [state, setState] = useState(null);
  const operation = useRef({ id: 0, pending: false });
  const read = useCallback(async (wire = null) => {
    const requests = operation.current;
    if (!enabled || requests.pending || (wire && !boardCenter)) return;
    const id = ++requests.id;
    const current = () => requests.id === id && controller.boardInfo === connection && controller.ready;
    requests.pending = true;
    setState(previous => ({ controller, connection, busy: true,
      mount: previous?.controller === controller && previous.connection === connection ? previous.mount : null }));
    let acknowledged = false;
    try {
      if (wire) {
        await controller.set_board_mount(...wire);
        acknowledged = true;
      }
      if (!current()) return;
      const mount = boardCenter ? await controller.get_board_mount() : await controller.get_imu_mount();
      if (!current()) return;
      const matches = !wire || (mount.configured && mountFields.every(({key}, i) => mount[key] === wire[i]));
      setState({ controller, connection, mount, applied: Boolean(wire && matches),
        error: matches ? null : 'Board readback differs from the requested mount. Review the returned geometry.' });
    } catch (error) {
      if (current()) {
        if (wire && !acknowledged && error.code === ErrorCode.SOURCE_SWITCH_UNSAFE)
          setState(previous => ({ ...previous, busy: false, error: 'The board rejected the change. Stop and disarm the platform, allow at least 100 ms of stationary encoder observations, then apply again.' }));
        else setState({ controller, connection, error:
          (acknowledged ? 'Mount acknowledged. Read again to verify the applied geometry. ' : '') + error.message });
      }
    } finally { if (id === requests.id) requests.pending = false; }
  }, [controller, connection, enabled, boardCenter]);
  useEffect(() => {
    const requests = operation.current;
    // Synchronize the active board session before enabling writes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (enabled) void read();
    return () => { requests.id++; requests.pending = false; };
  }, [enabled, read]);
  const actual = enabled && state?.controller === controller && state.connection === connection ? state : null;
  return { supported, boardCenter, boardProfile: getBoardProfile(connection), read, mount: actual?.mount, busy: enabled && (!actual || actual.busy),
    error: actual?.error, applied: actual?.applied };
}
