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
    const boardInfo = controller?.boardInfo;
    const version = prefix => {
        const parts = ['major', 'minor', 'patch'].map(part => boardInfo?.[`${prefix}_${part}`]);
        return parts.every(Number.isInteger) ? parts.join('.') : 'Unavailable';
    };
    const buildParts = [boardInfo?.firmware_build_high, boardInfo?.firmware_build_low];
    const firmwareBuild = buildParts.every(value => Number.isInteger(value) && value >= 0 && value <= 0xffffffff)
        && buildParts.some(value => value !== 0)
        ? buildParts.map(value => value.toString(16).padStart(8, '0')).join('')
        : 'Unavailable';

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
            <h2>Controller connected</h2>
            <p className="conn-summary-text">
                {transport
                    ? `Connected over ${transport}.`
                    : 'Connected to the controller.'}
            </p>
            <dl className="connection-versions">
                <div><dt>Board version</dt><dd>{version('board')}</dd></div>
                <div><dt>Protocol version</dt><dd>{version('protocol')}</dd></div>
                <div><dt>Firmware build</dt><dd>{firmwareBuild}</dd></div>
            </dl>
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
