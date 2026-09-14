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
    const [disconnectError, setDisconnectError] = useState('');

    // Called by the panel once a controller (local or proxy) is connected.
    const onConnected = (connectedController, usedTransport) => {
        setController(connectedController);
        setTransport(usedTransport || '');
        setIsConnected(true);
    };

    // Attempt each stop even if another command returns ERROR, and always release the link.
    const onDisconnect = async () => {
        const failures = [];
        const attempt = async (action) => {
            try { await action(); } catch (error) { failures.push(error.message); }
        };
        await attempt(() => controller.stop_platform_controller());
        for (let i = 0; i < 4; i++) await attempt(() => controller.delete_motor_controller(i));
        for (let i = 0; i < 4; i++) await attempt(() => controller.stop_motor(i));
        await attempt(() => controller.disconnect());
        setDisconnectError(failures.length ? `Disconnected. Some stop commands failed: ${[...new Set(failures)].join('; ')}` : '');
        setIsConnected(false);
        setTransport('');
    };

    if (!isConnected) {
        return (
            <>
            {disconnectError && <p className="conn-error" role="alert">{disconnectError}</p>}
            <ConnectionPanel
                onConnect={onConnected}
                onDisconnect={() => setIsConnected(false)}
            />
            </>
        );
    }

    return (
        <div className="connection-summary">
            <p className="conn-summary-text">
                {transport
                    ? `Connected over ${transport}.`
                    : 'Connected to the controller.'}
            </p>
            {controller.boardInfo && <p>Board version: {controller.boardInfo.board_major}.{controller.boardInfo.board_minor}.{controller.boardInfo.board_patch}</p>}
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
