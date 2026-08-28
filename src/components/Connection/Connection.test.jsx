import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ControllerContext } from '../../contexts/ControllerContext';
import Connection from './Connection';

// The connected branch is unreachable in a browser without hardware, so the
// context is supplied directly here.
function renderConnected(controller, setIsConnected = () => {}) {
  render(
    <ControllerContext.Provider
      value={{
        controller,
        setController: () => {},
        isConnected: true,
        setIsConnected,
      }}
    >
      <Connection />
    </ControllerContext.Provider>
  );
}

function fakeController() {
  return {
    stop_platform_controller: vi.fn().mockResolvedValue(undefined),
    delete_motor_controller: vi.fn().mockResolvedValue(undefined),
    stop_motor: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

describe('Connection section', () => {
  it('offers only the teardown action once connected', () => {
    renderConnected(fakeController());
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
  });

  it('stops the platform and the motors before dropping the link', async () => {
    const controller = fakeController();
    const setIsConnected = vi.fn();
    renderConnected(controller, setIsConnected);

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(controller.disconnect).toHaveBeenCalled());
    expect(controller.stop_platform_controller).toHaveBeenCalled();
    // One call per motor, so nothing is left driving after the link closes.
    expect(controller.delete_motor_controller).toHaveBeenCalledTimes(4);
    expect(controller.stop_motor).toHaveBeenCalledTimes(4);
    expect(setIsConnected).toHaveBeenCalledWith(false);
  });
});
