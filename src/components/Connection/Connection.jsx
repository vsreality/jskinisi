import { useState, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import ConnectionDialog from './ConnectionDialog';

function Connection() {
    const { controller, setController, isConnected, setIsConnected } = useContext(ControllerContext);
    const [showDialog, setShowDialog] = useState(false);

    // Called by the dialog once a controller (local or proxy) is connected.
    const onDialogConnect = (connectedController) => {
        setController(connectedController);
        setIsConnected(true);
        setShowDialog(false);
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
        console.log('Disconnected');
    };

    return (
        <div className='connection-panel'>
            <button className='k-button k-green' id="buttonConnectController" disabled={isConnected} onClick={() => setShowDialog(true)}>Connect</button>
            <button className='k-button k-blue' id="buttonDisconectController" disabled={!isConnected} onClick={onDisconnect}>Diconnect</button>
            {showDialog && (
                <ConnectionDialog
                    onConnect={onDialogConnect}
                    onClose={() => setShowDialog(false)}
                    onDisconnect={() => setIsConnected(false)}
                />
            )}
        </div>
    );
}

export default Connection;
