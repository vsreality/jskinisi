import { useState, useContext, useEffect, useRef } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './MotorControllerTab.css';
import '../Common.css';
import MotorControllerChart from './MotorControllerChart';

function MotorControllerTab(){
    const updateInterval = 500;
    const motorControllerChartRef = useRef();
    const updateStateIntervalId = useRef(null);

    const { controller, isConnected} = useContext(ControllerContext);
    
    const [motorIndex, setMotorIndex] = useState('0');
    const [isMotorReversed, setIsMotorReversed] = useState(false);
    const [isEncoderReversed, setIsEncoderReversed] = useState(false);
    const [motorSpeed, setMotorSpeed] = useState(0);
    const [encoderIndex, setEncoderIndex] = useState('0');
    const [encoderResolution, setEncoderResolution] = useState(1425.1);
    const [kp, setKp] = useState('0.1');
    const [ki, setKi] = useState('0');
    const [kd, setKd] = useState('0');
    const [integralLimit, setIntegralLimit] = useState('30');
    const [controllerFrequency, setControllerFrequency] = useState('10');
    const [isMotorControllerInitialized, setIsMotorControllerInitialized] = useState([false, false, false, false]);
    const [isUpdateStateIntervalRunning, setIsUpdateStateIntervalRunning] = useState(false);
    const [motorControllerState, motorControllerStateUpdate] = useState({
        motor_index: 0,
        kp: 0,
        ki: 0,
        kd: 0,
        target_speed: 0,
        current_speed: 0,
        error: 0,
        output: 0,
    });

    const handleMotorIndexChange = (event) => {
        setMotorIndex(event.target.value);
        motorControllerChartRef.current.resetChart();
        console.log(isMotorControllerInitialized);
        setIsUpdateStateIntervalRunning(isMotorControllerInitialized[event.target.value]);
    };

    const handleMotorReversedChange = (event) => {
        setIsMotorReversed(event.target.checked);
    };

    const handleEncoderReversedChange = (event) => {
        setIsEncoderReversed(event.target.checked);
    };

    const handleEncoderResolutionChange = (event) => {
        setEncoderResolution(event.target.value);
    };

    const handleMotorSpeedChange = (event) => {
        setMotorSpeed(event.target.value);
    };

    const handleEncoderIndexChange = (event) => {
        setEncoderIndex(event.target.value);
    };

    const handleKpChange = (event) => {
        setKp(event.target.value);
    };

    const handleKiChange = (event) => {
        setKi(event.target.value);
    };

    const handleKdChange = (event) => {
        setKd(event.target.value);
    };

    const handleIntegralLimitChange = (event) => {
        setIntegralLimit(event.target.value);
    };

    const handleControllerFrequencyChange = (event) => {
        setControllerFrequency(event.target.value);
    };

    // Set the global controller-loop frequency (Hz, 1-1000).
    const setControllerFrequencyFunction = async () => {
        console.log(`Setting controller frequency to ${controllerFrequency} Hz`);
        await controller.set_controller_frequency(parseInt(controllerFrequency, 10));
    };

    // Read back the global controller-loop frequency (Hz).
    const getControllerFrequencyFunction = async () => {
        const frequency = await controller.get_controller_frequency();
        setControllerFrequency(frequency.toString());
    };

    // Initialize motor controller
    const initializeMotorControllerFunction = async () => {
        console.log(`Initializing motor controller`);
        motorControllerChartRef.current.resetChart();
        await controller.initialize_motor_controller(motorIndex, isMotorReversed, encoderIndex, isEncoderReversed, encoderResolution, kp, ki, kd, integralLimit);
        // start periodicly requesting motor controller state
        setIsUpdateStateIntervalRunning(true)
        // Set corresponding motor controller initialized flag to true
        let states = [...isMotorControllerInitialized];
        states[motorIndex] = true;
        setIsMotorControllerInitialized(states);
    };

    // Simulated function for setting motor speed
    const setMotorSpeedFunction = async () => {
        console.log(`Setting motor ${motorIndex} speed to ${motorSpeed}, reverse: ${isMotorReversed}`);
        await controller.set_motor_target_speed(motorIndex, motorSpeed);
    };

    const getControllerStateFunction = async () => {
        //console.log(`Getting controller state`);
        /*
        motor_index,
        kp,
        ki,
        kd,
        target_speed,
        current_speed,
        error,
        output,
        */
        var state = await controller.get_motor_controller_state(motorIndex);

        // TODO: Remove this hack
        state.output = state.output / 10;

        motorControllerStateUpdate(state);
        //console.log(state);
    };

    // Stop motor controller
    const stopMotorControllerFunction = async () => {
        // Stop periodicly requesting motor controller state
        setIsUpdateStateIntervalRunning(false);
        // Set corresponding motor controller initialized flag to false
        let states = [...isMotorControllerInitialized];
        states[motorIndex] = false;
        setIsMotorControllerInitialized(states);

        // Set motor speed to 0
        setMotorSpeed(0);

        // Stop motor controller
        console.log(`Stopping motor controller`);
        await controller.delete_motor_controller(motorIndex);
    };

    // Reset the motor controller's PID state (integral/error) without deleting it.
    const resetMotorControllerFunction = async () => {
        console.log(`Resetting motor controller ${motorIndex}`);
        await controller.reset_motor_controller(motorIndex);
    };

    // Clearing local UI state when the link drops is a deliberate
    // synchronisation with an external system (the serial / WebSocket
    // connection), not derived state. Restructuring this to avoid setState
    // would change observable disconnect behaviour, so the rule is scoped off
    // here rather than worked around.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!isConnected) {
            setMotorSpeed(0);
            setIsUpdateStateIntervalRunning(false);
        }
    }, [isConnected]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // The polling interval below is started once, when polling is switched on,
    // but getControllerStateFunction closes over `motorIndex` and `controller`.
    // Keeping the latest version in a ref means the timer always reads the
    // motor currently selected, without having to tear down and restart it.
    const getControllerStateRef = useRef(getControllerStateFunction);
    useEffect(() => {
        getControllerStateRef.current = getControllerStateFunction;
    });

    useEffect(() => {
        if (isUpdateStateIntervalRunning) {
          // Start the timer
          updateStateIntervalId.current = setInterval(
            () => getControllerStateRef.current(), updateInterval);
        } else {
          // Stop the timer
          if (updateStateIntervalId.current) {
            clearInterval(updateStateIntervalId.current);
          }
        }
    
        // Cleanup function to clear the interval
        return () => {
          if (updateStateIntervalId.current) {
            clearInterval(updateStateIntervalId.current);
          }
        };
      }, [isUpdateStateIntervalRunning, updateInterval]);

    return (
        <div className='controllerTag k-container card-row motor-controller-options'>
                <fieldset className='settings-card'>
                <legend>Motor &amp; Encoder</legend>
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
                    <input type='checkbox' className='k-check' checked={isMotorReversed} onChange={handleMotorReversedChange}/>
                </p>
                <p>
                    <label className='label-for-check'>Is Encoder Reverse </label>
                    <input type='checkbox' className='k-check' checked={isEncoderReversed} onChange={handleEncoderReversedChange}/>
                </p>
                <div>
                    <label htmlFor='encoderIndex'>Encoder Index:</label>
                    <select id='encoderIndex' value={encoderIndex} onChange={handleEncoderIndexChange}>
                        <option value='0'>Encoder 0</option>
                        <option value='1'>Encoder 1</option>
                        <option value='2'>Encoder 2</option>
                        <option value='3'>Encoder 3</option>
                    </select><br/>
                    <label htmlFor='encoderResolution'>Encoder Resolution (ticks/rev):</label><br/>
                    <input type='text' id='encoderResolution' value={encoderResolution} onChange={handleEncoderResolutionChange}/><br/>
                </div>
                {/* PID Parameters*/}
                </fieldset>
                <fieldset className='settings-card'>
                <legend>PID Parameters</legend>
                <div>
                    <label htmlFor='kp'>Kp:</label><br/>
                    <input type='text' id='kp' value={kp} onChange={handleKpChange}/><br/>
                    <label htmlFor='ki'>Ki:</label><br/>
                    <input type='text' id='ki' value={ki} onChange={handleKiChange}/><br/>
                    <label htmlFor='kd'>Kd:</label><br/>
                    <input type='text' id='kd' value={kd} onChange={handleKdChange}/><br/>
                    <label htmlFor='integralLimit'>Integral Limit:</label><br/>
                    <input type='text' id='integralLimit' value={integralLimit} onChange={handleIntegralLimitChange}/><br/>
                </div>
                {/* Global controller-loop frequency */}
                </fieldset>
                <fieldset className='settings-card'>
                <legend>Controller Frequency</legend>
                <div>
                    <label htmlFor='controllerFrequency'>Controller Frequency (Hz, 1-1000):</label><br/>
                    <input type='number' id='controllerFrequency' min='1' max='1000' value={controllerFrequency} onChange={handleControllerFrequencyChange}/><br/>
                    <button className='k-button k-blue' onClick={setControllerFrequencyFunction}>Set Frequency</button>
                    <button className='k-button k-blue' onClick={getControllerFrequencyFunction}>Get Frequency</button>
                </div>
                </fieldset>
                <fieldset className='settings-card'>
                <legend>Actions</legend>
                <p>
                    <button className='k-button k-blue' onClick={initializeMotorControllerFunction}>Initialize Motor Controller</button>
                    <label htmlFor='motorSpeed'>Speed (radian/sec):</label>
                    <input className='' type='range' min='-8' max='8' step='0.5' value={motorSpeed} id='motorSpeed' onChange={handleMotorSpeedChange}/>
                    <button className='k-button k-blue' onClick={setMotorSpeedFunction}>Set motor Speed</button>
                    <button className='k-button k-blue' onClick={getControllerStateFunction}>GetControllerState</button>
                    <button className='k-button k-blue' onClick={resetMotorControllerFunction}>Reset Controller</button>
                    <button className='k-button k-blue' onClick={stopMotorControllerFunction}>Stop Controller</button>
                </p>
                </fieldset>
            <div className='column'>
            <MotorControllerChart ref={motorControllerChartRef} motorControllerState = {motorControllerState}/>
            </div>
        </div>
    );
}

export default MotorControllerTab;