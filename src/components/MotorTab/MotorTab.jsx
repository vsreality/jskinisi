import { useState, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './MotorTab.css';
import '../Common.css';

function MotorTab(){
    const { controller } = useContext(ControllerContext);
    
    const [motorIndex, setMotorIndex] = useState('0');
    const [isMotorInitialized, setIsMotorInitialized] = useState([false, false, false, false]);
    const [isMotorReversed, setIsMotorReversed] = useState([false, false, false, false]);
    const [motorSpeed, setMotorSpeed] = useState(0);
    const [encoderIndex, setEncoderIndex] = useState('0');
    const [encoderValue, setEncoderValue] = useState('');
    const [encoderResolution, setEncoderResolution] = useState([1425.1, 1425.1, 1425.1, 1425.1]);
    const [isEncoderInitialized, setIsEncoderInitialized] = useState([false, false, false, false]);
    const [isEncoderReversed, setIsEncoderReversed] = useState([false, false, false, false]);
    const [isOdometryStarted, setIsOdometryStarted] = useState([false, false, false, false]);
    const [encoderOdometry, setEncoderOdometry] = useState([0, 0, 0, 0]);

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
        setEncoderValue(value);
        console.log(`Encoder ${encoderIndex} value: ${value}`);
    };

    const startOdometryFunction = async () => {
        console.log(`Starting odometry. Encoder ${encoderIndex}`);
        setIsOdometryStarted({ ...isOdometryStarted, [encoderIndex]: true });
        await controller.start_encoder_odometry(encoderIndex);
    }

    const resetOdometryFunction = async () => {
        console.log(`Resetting odometry. Encoder ${encoderIndex}`);
        await controller.reset_encoder_odometry(encoderIndex);
    }

    const getOdometryFunction = async () => {
        console.log(`Getting odometry. Encoder ${encoderIndex}`);
        var value = await controller.get_encoder_odometry(encoderIndex);
        setEncoderOdometry({ ...encoderOdometry, [encoderIndex]: value });
        console.log(`Odometry: ${value}`);
    }

    const stopOdometryFunction = async () => {
        console.log(`Stopping odometry. Encoder ${encoderIndex}`);
        await controller.stop_encoder_odometry(encoderIndex);
        setIsOdometryStarted({ ...isOdometryStarted, [encoderIndex]: false });
    }

    return (
        <div className='motor-tab controllerTag k-container card-row'>
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
                <button className='k-button k-blue' onClick={initializeMotorFunction}>Initialize Motor</button>
            </p>
            <p>
                <label htmlFor='motorSpeed'>Speed (PWM):</label>
                <input className='' type='range' min='-100' max='100' value={motorSpeed} id='motorSpeed' onChange={handleMotorSpeedChange}/>
                <button className='k-button k-blue' onClick={setMotorSpeedFunction}>Set motor Speed</button>
                <button className='k-button k-blue' onClick={stopMotorFunction}>Stop motor</button>
                <button className='k-button k-blue' onClick={brakeMotorFunction}>Brake motor</button>
            </p>

            {/* Encoder Controls */}
            </fieldset>
            <fieldset className='settings-card'>
            <legend>Encoder</legend>
            <div>
                <label htmlFor='encoderIndex'>Encoder Index:</label>
                <select id='encoderIndex' value={encoderIndex} onChange={handleEncoderIndexChange}>
                    <option value='0'>Encoder 0</option>
                    <option value='1'>Encoder 1</option>
                    <option value='2'>Encoder 2</option>
                    <option value='3'>Encoder 3</option>
                </select><br/>
                <label htmlFor='encoderResolution'>Encoder Resolution (ticks/rev):</label>
                <input type='number' value={encoderResolution[encoderIndex]} onChange={handleEncoderResolutionChange}/>
                <label className='label-for-check'>Is Reverse </label>
                <input type='checkbox' className='k-check' checked={isEncoderReversed[encoderIndex]} onChange={handleEncoderReversedChange}/>
                <button className='k-button k-blue' onClick={initializeEncoderFunction}>Initialize encoder</button>
                <button className='k-button k-blue' onClick={getEncoderValueFunction}>Get Encoder Value</button>
                <div id='encoderValue'>{encoderValue}</div>
            </div>
            
            {/* Odometry */}
            <div className={!isEncoderInitialized[encoderIndex] ? 'disabled-div' : ''}>
                <button className='k-button k-blue' onClick={startOdometryFunction}>Start Odometry</button>
                <div className={!isOdometryStarted[encoderIndex] ? 'disabled-div' : ''}> 
                    <button className='k-button k-blue' onClick={resetOdometryFunction}>Reset Odometry</button>
                    <button className='k-button k-blue' onClick={stopOdometryFunction}>Stop Odometry</button>
                    <button className='k-button k-blue' onClick={getOdometryFunction}>Get Odometry</button>
                    <div>{encoderOdometry[encoderIndex]}</div>
                </div>
            </div>
            </fieldset>
        </div>
    );
}

export default MotorTab;