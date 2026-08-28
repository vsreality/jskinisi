import { useState, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import ConnectionPanel from './ConnectionPanel';
import './ConnectionPanel.css';

// The Connection section. Shows the transport chooser while disconnected and
// the teardown control once a controller is attached, so there is only ever
// one connection action on screen.
function Connection() {
    const { controller, setController, isConnected, setIsConnected } = useContext(ControllerContext);
    const [transport, setTransport] = useState('');

    // Called by the panel once a controller (local or proxy) is connected.
    const onConnected = (connectedController, usedTransport) => {
        setController(connectedController);
        setTransport(usedTransport || '');
        setIsConnected(true);
    };

    const onDisconnect = async () => {
        console.log('Disconnecting...');
        await controller.stop_platform_controller();

        for (let i = 0; i < 4; i++) {
            await controller.delete_motor_controller(i);
        }

        for (let i = 0; i < 4; i++) {
            await controller.stop_motor(i);
        }

        await controller.disconnect();
        setIsConnected(false);
        setTransport('');
        console.log('Disconnected');
    };

    if (!isConnected) {
        return (
            <ConnectionPanel
                onConnect={onConnected}
                onDisconnect={() => setIsConnected(false)}
            />
        );
    }

    return (
        <div className="connection-summary">
            <p className="conn-summary-text">
                {transport
                    ? `Connected over ${transport}.`
                    : 'Connected to the controller.'}
            </p>
            <button
                className="k-button k-button-danger"
                id="buttonDisconectController"
                onClick={onDisconnect}
            >
                Disconnect
            </button>
        </div>
    );
}

export default Connection;
