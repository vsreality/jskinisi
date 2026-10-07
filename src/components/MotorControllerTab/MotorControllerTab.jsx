import PositionControl from '../PositionControl/PositionControl';
import { useSettings } from '../../contexts/SettingsContext';
import VelocityTuningHelp from '../VelocityTuningHelp';
import { velocityPidDefaults } from '../../commands/velocity_tuning';
// API-v2 actions display controller errors and await command acknowledgements.
import { useCommandAction } from '../../hooks/useCommandAction';
import { useState, useContext, useEffect, useRef } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './MotorControllerTab.css';
import '../Common.css';
import MotorControllerChart from './MotorControllerChart';

function MotorControllerTab(){
    const [commandError, runCommand] = useCommandAction();
    const updateInterval = 500;
    const [positionGeneration, setPositionGeneration] = useState(0);
    const motorControllerChartRef = useRef();
    const updateStateIntervalId = useRef(null);

    const { controller, isConnected} = useContext(ControllerContext);
    const pidDefaults = velocityPidDefaults(controller?.boardInfo);

    const [motorIndex, setMotorIndex] = useState('0');
    const [isMotorReversed, setIsMotorReversed] = useState(false);
    const [isEncoderReversed, setIsEncoderReversed] = useState(false);
    const [motorSpeed, setMotorSpeed] = useState(0);
    const { angleUnit: speedUnit } = useSettings();
    const speedDisplayScale = speedUnit === 'deg' ? 180 / Math.PI : 1;
    const [encoderIndex, setEncoderIndex] = useState('0');
    const [encoderResolution, setEncoderResolution] = useState(1425.1);
    const [kp, setKp] = useState(pidDefaults.kp);
    const [ki, setKi] = useState(pidDefaults.ki);
    const [kd, setKd] = useState(pidDefaults.kd);
    const [integralLimit, setIntegralLimit] = useState(pidDefaults.integralLimit);
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
        setMotorSpeed(Number(event.target.value) / speedDisplayScale);
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
        setPositionGeneration(value => value + 1);
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
        const state = await controller.get_motor_controller_state(motorIndex);
        motorControllerStateUpdate(state);
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
        setPositionGeneration(value => value + 1);
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
            setIsMotorControllerInitialized([false, false, false, false]);
            setPositionGeneration(value => value + 1);
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
            () => runCommand(() => getControllerStateRef.current()), updateInterval);
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
      }, [isUpdateStateIntervalRunning, updateInterval, runCommand]);

    return (
        <div className="motor-controller-options">
            {commandError && <p className="conn-error" role="alert">{commandError}</p>}
            <div className="controller-setup">
                <fieldset className="settings-card hardware-setup">
                    <legend>Motor &amp; encoder</legend>
                    <div className="hardware-fields">
                        <label htmlFor="motorIndex">Motor
                            <select id="motorIndex" value={motorIndex} onChange={handleMotorIndexChange}>
                                {[0, 1, 2, 3].map(index => <option key={index} value={index}>Motor {index}</option>)}
                            </select>
                        </label>
                        <label htmlFor="encoderIndex">Encoder
                            <select id="encoderIndex" value={encoderIndex} onChange={handleEncoderIndexChange}>
                                {[0, 1, 2, 3].map(index => <option key={index} value={index}>Encoder {index}</option>)}
                            </select>
                        </label>
                        <label htmlFor="encoderResolution">Resolution (ticks/rev)
                            <input type="text" id="encoderResolution" value={encoderResolution} onChange={handleEncoderResolutionChange}/>
                        </label>
                    </div>
                    <div className="controller-checks">
                        <label><input type="checkbox" checked={isMotorReversed} onChange={handleMotorReversedChange}/> Reverse motor</label>
                        <label><input type="checkbox" checked={isEncoderReversed} onChange={handleEncoderReversedChange}/> Reverse encoder</label>
                    </div>
                </fieldset>
                <fieldset className="settings-card frequency-setup">
                    <legend>Loop frequency</legend>
                    <label htmlFor="controllerFrequency">Frequency (Hz, 1–1000)</label>
                    <div className="frequency-actions">
                        <input type="number" id="controllerFrequency" min="1" max="1000" value={controllerFrequency} onChange={handleControllerFrequencyChange}/>
                        <button className="k-button" onClick={() => runCommand(setControllerFrequencyFunction)}>Set Frequency</button>
                        <button className="k-button" onClick={() => runCommand(getControllerFrequencyFunction)}>Get Frequency</button>
                    </div>
                </fieldset>
            </div>
            <section className="controller-workspace" aria-label="Velocity control and feedback">
                <fieldset className="settings-card velocity-control">
                    <legend>1. Velocity control</legend>
                    <p className="controller-help">Tune speed tracking first. Position control uses this velocity PID.</p>
                    <VelocityTuningHelp boardInfo={controller?.boardInfo} ki={ki} integralLimit={integralLimit} />
                    <div className="controller-field-grid">
                        <label htmlFor="kp">Velocity Kp
                            <input type="text" id="kp" value={kp} onChange={handleKpChange}/>
                        </label>
                        <label htmlFor="ki">Velocity Ki
                            <input type="text" id="ki" value={ki} onChange={handleKiChange}/>
                        </label>
                        <label htmlFor="kd">Velocity Kd
                            <input type="text" id="kd" value={kd} onChange={handleKdChange}/>
                        </label>
                        <label htmlFor="integralLimit">Integral contribution limit (% PWM)
                            <input type="number" min="0" max="100" id="integralLimit" value={integralLimit} onChange={handleIntegralLimitChange}/>
                        </label>
                    </div>
                    <button className="k-button k-button-primary controller-initialize" onClick={() => runCommand(initializeMotorControllerFunction)}>Initialize velocity controller</button>
                    <div className="controller-target">
                        <label htmlFor="motorSpeed">Speed target <output>{Number((motorSpeed * speedDisplayScale).toFixed(3))} {speedUnit}/s</output></label>
                        <input type="range" min={-8 * speedDisplayScale} max={8 * speedDisplayScale}
                            step={0.5 * speedDisplayScale} value={motorSpeed * speedDisplayScale} id="motorSpeed" onChange={handleMotorSpeedChange}/>
                        <button className="k-button" onClick={() => runCommand(setMotorSpeedFunction)}>Set velocity target</button>
                    </div>
                    <div className="controller-actions">
                        <button className="k-button" onClick={() => runCommand(getControllerStateFunction)}>Get Controller State</button>
                        <button className="k-button" onClick={() => runCommand(resetMotorControllerFunction)}>Reset velocity PID</button>
                    </div>
                    <button className="k-button k-button-danger controller-stop" onClick={() => runCommand(stopMotorControllerFunction)}>Stop motor controller</button>
                </fieldset>
                <section className="controller-chart velocity-chart" aria-label="Velocity response">
                    <div className="velocity-chart-heading">
                        <h3>Velocity response</h3>
                        <label><input type="checkbox" checked={isUpdateStateIntervalRunning}
                            disabled={!isConnected || !isMotorControllerInitialized[motorIndex]}
                            onChange={event => setIsUpdateStateIntervalRunning(event.target.checked)}/> Live velocity graph</label>
                    </div>
                    <p className="controller-help">Measured speed and target · 0.5 s updates · latest 120 samples. Select Speed error in the legend to show the error.</p>
                    <MotorControllerChart ref={motorControllerChartRef} motorControllerState={motorControllerState} speedUnit={speedUnit}/>
                </section>
            </section>
            <PositionControl key={`${motorIndex}-${positionGeneration}-${isConnected}`}
                motorIndex={Number(motorIndex)} velocityReady={isMotorControllerInitialized[motorIndex]} />
        </div>
    );
}

export default MotorControllerTab;
