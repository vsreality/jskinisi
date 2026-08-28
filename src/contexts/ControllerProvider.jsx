import { useState } from 'react';
import { ControllerContext } from './ControllerContext';
import { KinisiClient } from '../commands/kinisi_client';

export const ControllerProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);

    // The active controller. It may be swapped at runtime between a local
    // Web Serial client (KinisiClient) and a WebSocket proxy client
    // (KinisiWebSocketClient); both share the same Commands interface, so the
    // rest of the app doesn't care which one is in use.
    const [controller, setController] = useState(
        () => new KinisiClient(() => setIsConnected(false))
    );

    const value = {
        controller,
        setController,
        isConnected,
        setIsConnected
    };

    return (
        <ControllerContext.Provider value={value}>
            {children}
        </ControllerContext.Provider>
    );
};

export default ControllerProvider;
