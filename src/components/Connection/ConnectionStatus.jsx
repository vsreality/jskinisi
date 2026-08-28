import { useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './ConnectionStatus.css';

// The link state, shown in the app header so it is visible from every section.
function ConnectionStatus() {
    const { isConnected } = useContext(ControllerContext);

    return (
        <span
            className={`connection-status${isConnected ? ' is-connected' : ''}`}
            role="status"
        >
            <span className="connection-status-dot" aria-hidden="true"></span>
            {isConnected ? 'Connected' : 'Not connected'}
        </span>
    );
}

export default ConnectionStatus;
