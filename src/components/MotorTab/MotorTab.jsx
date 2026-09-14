import OdometryTimestamp from '../OdometryTimestamp';
// API-v2 actions display controller errors and await command acknowledgements.
import { useCommandAction } from '../../hooks/useCommandAction';
import { useState, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './MotorTab.css';
import '../Common.css';

function MotorTab(){
    const [commandError, runCommand] = useCommandAction();
    const { controller } = useContext(ControllerContext);
    
    const [motorIndex, setMotorIndex] = useState('0');
    const [isMotorInitialized, setIsMotorInitialized] = useState([false, false, false, false]);
    const [isMotorReversed, setIsMotorReversed] = useState([false, false, false, false]);
    const [motorSpeed, setMotorSpeed] = useState(0);
    const [encoderIndex, setEncoderIndex] = useState('0');
    const [encoderValue, setEncoderValue] = useState([null, null, null, null]);
    const [encoderResolution, setEncoderResolution] = useState([1425.1, 1425.1, 1425.1, 1425.1]);
    const [isEncoderInitialized, setIsEncoderInitialized] = useState([false, false, false, false]);
    const [isEncoderReversed, setIsEncoderReversed] = useState([false, false, false, false]);
    const [isOdometryStarted, setIsOdometryStarted] = useState([false, false, false, false]);
    const [encoderOdometry, setEncoderOdometry] = useState([null, null, null, null]);

    const handleMotorIndexChange = (event) => {
        setMotorIndex(event.target.value);
    };

    const handleMotorReversedChange = (event) => {
        setIsMotorReversed({ ...isMotorReversed, [motorIndex]: event.target.checked });
    };

    const handleMotorSpeedChange = (event) => {
        setMotorSpeed(event.target.value);
    };

    const handleEncoderIndexChange = (event) => {
        setEncoderIndex(event.target.value);
    };

    const handleEncoderReversedChange = (event) => {
        setIsEncoderReversed({ ...isEncoderReversed, [encoderIndex]: event.target.checked });
    }

    const handleEncoderResolutionChange = (event) => {
        setEncoderResolution({ ...encoderResolution, [encoderIndex]: event.target.value });
    }

    const initializeMotorFunction = async () => {
        console.log(`Initializing motor ${motorIndex}`);
        await controller.initialize_motor(motorIndex, isMotorReversed[motorIndex]);
        setIsMotorInitialized({ ...isMotorInitialized, [motorIndex]: true });
    }

    const initializeEncoderFunction = async () => {
        console.log(`Initializing encoder ${encoderIndex}, resolution: ${encoderResolution[encoderIndex]}, reverse: ${isEncoderReversed[encoderIndex]}`);
        await controller.initialize_encoder(encoderIndex, encoderResolution[encoderIndex], isEncoderReversed[encoderIndex]);
        setIsEncoderInitialized({ ...isEncoderInitialized, [encoderIndex]: true });
    };

    // Simulated function for setting motor speed
    const setMotorSpeedFunction = async () => {
        console.log(`Setting motor ${motorIndex} speed to ${motorSpeed}, reverse: ${isMotorReversed[motorIndex]}`);

        await controller.initialize_motor(motorIndex, isMotorReversed[motorIndex]);
        await controller.set_motor_speed(motorIndex, motorSpeed);
    };

    // Simulated function to stop the motor
    const stopMotorFunction = async () => {
        console.log(`Stopping motor ${motorIndex}`);
        setMotorSpeed(0);
        await controller.stop_motor(motorIndex);
    };

    // Simulated function to brake the motor
    const brakeMotorFunction = async () => {
        console.log(`Braking motor ${motorIndex}`);
        setMotorSpeed(0);
        await controller.brake_motor(motorIndex);
    };

    // Simulated function to get encoder value
    const getEncoderValueFunction = async () => {
        var value = await controller.get_encoder_value(encoderIndex);
        setEncoderValue(values => ({ ...values, [encoderIndex]: value }));
        console.log(`Encoder ${encoderIndex} value: ${value}`);
    };

    const startOdometryFunction = async () => {
        console.log(`Starting odometry. Encoder ${encoderIndex}`);
        await controller.start_encoder_odometry(encoderIndex);
        setEncoderOdometry(samples => ({ ...samples, [encoderIndex]: null }));
        setIsOdometryStarted({ ...isOdometryStarted, [encoderIndex]: true });
    }

    const resetOdometryFunction = async () => {
        console.log(`Resetting odometry. Encoder ${encoderIndex}`);
        await controller.reset_encoder_odometry(encoderIndex);
        setEncoderOdometry(samples => ({ ...samples, [encoderIndex]: null }));
    }

    const getOdometryFunction = async () => {
        console.log(`Getting odometry. Encoder ${encoderIndex}`);
        var value = await controller.get_encoder_odometry(encoderIndex);
        setEncoderOdometry(samples => ({ ...samples, [encoderIndex]: value }));
        console.log('Odometry sample:', value);
    }

    const stopOdometryFunction = async () => {
        console.log(`Stopping odometry. Encoder ${encoderIndex}`);
        await controller.stop_encoder_odometry(encoderIndex);
        setEncoderOdometry(samples => ({ ...samples, [encoderIndex]: null }));
        setIsOdometryStarted({ ...isOdometryStarted, [encoderIndex]: false });
    }

    return (
        <div className='motor-tab controllerTag k-container card-row'>
            {commandError && <p className="conn-error" role="alert">{commandError}</p>}
            <fieldset className='settings-card'>
            <legend>Motor</legend>
            {/* Motor Controls */}
            <p>
                <label>Motor Index </label>
                <select value={motorIndex} onChange={handleMotorIndexChange}>
                    <option value='0'>Motor 0</option>
                    <option value='1'>Motor 1</option>
                    <option value='2'>Motor 2</option>
                    <option value='3'>Motor 3</option>
                </select>
            </p>
            <p>
                <label className='label-for-check'>Is Reverse </label>
                <input type='checkbox' className='k-check' checked={isMotorReversed[motorIndex]} onChange={handleMotorReversedChange}/>
                <button className='k-button k-button-primary' onClick={() => runCommand(initializeMotorFunction)}>Initialize Motor</button>
            </p>
            <p>
                <label htmlFor='motorSpeed'>Speed (PWM):</label>
                <input className='' type='range' min='-100' max='100' value={motorSpeed} id='motorSpeed' onChange={handleMotorSpeedChange}/>
                <button className='k-button' onClick={() => runCommand(setMotorSpeedFunction)}>Set motor Speed</button>
                <button className='k-button k-button-danger' onClick={() => runCommand(stopMotorFunction)}>Stop motor</button>
                <button className='k-button k-button-danger' onClick={() => runCommand(brakeMotorFunction)}>Brake motor</button>
            </p>

            {/* Encoder Controls */}
            </fieldset>
            <fieldset className="settings-card encoder-card">
                <legend>Encoder</legend>
                <section className="encoder-section" aria-labelledby="encoderSetupTitle">
                    <h3 id="encoderSetupTitle">Setup</h3>
                    <div className="encoder-fields">
                        <div className="encoder-field">
                            <label htmlFor="encoderIndex">Encoder</label>
                            <select id="encoderIndex" value={encoderIndex} onChange={handleEncoderIndexChange}>
                                {[0, 1, 2, 3].map(index => <option key={index} value={index}>Encoder {index}</option>)}
                            </select>
                        </div>
                        <div className="encoder-field">
                            <label htmlFor="encoderResolution">Resolution <span>(ticks/rev)</span></label>
                            <input id="encoderResolution" type="number" value={encoderResolution[encoderIndex]} onChange={handleEncoderResolutionChange}/>
                        </div>
                    </div>
                    <label className="encoder-reverse">
                        <input type="checkbox" checked={isEncoderReversed[encoderIndex]} onChange={handleEncoderReversedChange}/>
                        Reverse direction
                    </label>
                    <button className="k-button k-button-primary" onClick={() => runCommand(initializeEncoderFunction)}>Initialize encoder</button>
                </section>

                <section className="encoder-section encoder-counter" aria-label="Encoder count">
                    <div>
                        <span className="encoder-reading-label">Encoder count</span>
                        <div><output id="encoderValue">{encoderValue[encoderIndex] ?? '—'}</output> <span className="encoder-unit">ticks</span></div>
                    </div>
                    <button className="k-button" disabled={!isEncoderInitialized[encoderIndex]} onClick={() => runCommand(getEncoderValueFunction)}>Get value</button>
                </section>

                <section className="encoder-section" aria-labelledby="encoderOdometryTitle">
                    <div className="encoder-section-heading">
                        <h3 id="encoderOdometryTitle">Odometry</h3>
                        <span className={`encoder-status${isOdometryStarted[encoderIndex] ? ' is-running' : ''}`}>
                            {isOdometryStarted[encoderIndex] ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                    <div className="encoder-actions">
                        <button className="k-button" disabled={!isEncoderInitialized[encoderIndex] || isOdometryStarted[encoderIndex]} onClick={() => runCommand(startOdometryFunction)}>Start odometry</button>
                        <button className="k-button k-button-danger" disabled={!isOdometryStarted[encoderIndex]} onClick={() => runCommand(stopOdometryFunction)}>Stop odometry</button>
                        <button className="k-button" disabled={!isOdometryStarted[encoderIndex]} onClick={() => runCommand(resetOdometryFunction)}>Reset odometry</button>
                        <button className="k-button" disabled={!isOdometryStarted[encoderIndex]} onClick={() => runCommand(getOdometryFunction)}>Get odometry</button>
                    </div>
                    <div className="encoder-sample" aria-label="Latest odometry sample">
                        <span className="encoder-reading-label">Angle</span>
                        <div className="encoder-angle"><output>{encoderOdometry[encoderIndex]?.angle ?? '—'}</output> <span className="encoder-unit">rad</span></div>
                        <OdometryTimestamp sample={encoderOdometry[encoderIndex]} />
                    </div>
                </section>
            </fieldset>
        </div>
    );
}

export default MotorTab;