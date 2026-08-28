import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './PlatformTab.css';
import '../Common.css'

function PlatformTab() {
    const { controller, isConnected} = useContext(ControllerContext);

    const [isPlatformInitialized, setIsPlatformInitialized] = useState(false);

    // States for platform type and settings
    const [platformType, setPlatformType] = useState('omni');
    const [isReversed, setIsReversed] = useState({
        mecanum: [false, false, false, false],
        omni: [false, false, false],
        differential: [false, false]
    });
    const [isEncoderReversed, setIsEncoderReversed] = useState({
        mecanum: [false, false, false, false],
        omni: [false, false, false],
        differential: [false, false]
    });

    // Mecanum platform properties
    const [mecanumWheelDiameter, setMecanumWheelDiameter] = useState(0.1);
    const [mecanumLength, setMecanumLength] = useState(0.5);
    const [mecanumWidth, setMecanumWidth] = useState(0.5);

    // Omni platform properties
    const [omniWheelDiameter, setOmniWheelDiameter] = useState(0.1);
    const [omniRadius, setOmniRadius] = useState(0.15);

    // Differential platform properties
    const [differentialWheelDiameter, setDifferentialWheelDiameter] = useState(0.1);
    const [differentialWheelBase, setDifferentialWheelBase] = useState(0.3);


    const [velocity, setVelocity] = useState({ x: 0, y: 0, t: 0 });

    // Keyboard (WASD) driving:
    //   W/S    -> forward/backward (X)
    //   A/D    -> rotate left/right (T)
    //   Shift + A/D -> strafe sideways left/right (Y)
    // Open-loop uses PWM magnitude (±100); when the platform controller is
    // enabled, WASD instead commands the closed-loop target velocity below
    // (linear m/s, angular rad/s).
    // Open-loop keyboard PWM magnitude (percent, 0-100) used when the platform
    // controller is not enabled.
    const [keyboardPwmSpeed, setKeyboardPwmSpeed] = useState('80');
    // Closed-loop keyboard target speeds: linear (X/Y, m/s) and angular (T, rad/s)
    // are configured independently.
    const [keyboardTargetSpeed, setKeyboardTargetSpeed] = useState('0.2');
    const [keyboardTargetAngularSpeed, setKeyboardTargetAngularSpeed] = useState('1.0');
    const [keyboardControlEnabled, setKeyboardControlEnabled] = useState(false);
    const pressedKeys = useRef(new Set());

    // Controller settings
    const [isControllerInitialized, setIsControllerInitialized] = useState(false);

    const [encoderResolution, setEncoderResolution] = useState('1425.1');
    const [kp, setKp] = useState('0.1');
    const [ki, setKi] = useState('0');
    const [kd, setKd] = useState('0');
    const [integralLimit, setIntegralLimit] = useState('30');

    const [velocityTarget, setVelocityTarget] = useState({ x: 0, y: 0, t: 0 });

    // Odometry
    const [isOdometryInitialized, setIsOdometryInitialized] = useState(false);
    const [odometry, setOdometry] = useState({ x: 0, y: 0, t: 0 });

    // Global loop frequencies (Hz, 1-1000)
    const [controllerFrequency, setControllerFrequency] = useState('10');
    const [odometryFrequency, setOdometryFrequency] = useState('50');

    // Handlers for changes in form elements
    const handlePlatformTypeChange = (event) => {
        setPlatformType(event.target.value);
    };

    const handleReverseChange = (platform, index) => (event) => {
        setIsReversed(prevState => ({
            ...prevState,
            [platform]: prevState[platform].map((item, i) => i === index ? event.target.checked : item)
        }));
    };

    const handleEncoderReverseChange = (platform, index) => (event) => {
        setIsEncoderReversed(prevState => ({
            ...prevState,
            [platform]: prevState[platform].map((item, i) => i === index ? event.target.checked : item)
        }));
    };

    const handleMecanumWheelDiameterChange = (event) => {
        setMecanumWheelDiameter(event.target.value);
    };

    const handleMecanumLengthChange = (event) => {
        setMecanumLength(event.target.value);
    };

    const handleMecanumWidthChange = (event) => {
        setMecanumWidth(event.target.value);
    };

    const handleOmniWheelDiameterChange = (event) => {
        setOmniWheelDiameter(event.target.value);
    };

    const handleOmniRadiusChange = (event) => {
        setOmniRadius(event.target.value);
    };

    const handleDifferentialWheelDiameterChange = (event) => {
        setDifferentialWheelDiameter(event.target.value);
    };

    const handleDifferentialWheelBaseChange = (event) => {
        setDifferentialWheelBase(event.target.value);
    };

    const handleVelocityChange = (axis) => (event) => {
        setVelocity(prevState => ({ ...prevState, [axis]: event.target.value }));
    };

    const handleEncoderResolutionChange = (event) => {
        setEncoderResolution(event.target.value);
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

    const handleVelocityTargetChange = (axis) => (event) => {
        setVelocityTarget({ ...velocityTarget, [axis]: event.target.value });
    };

    const handleIntegralLimitChange = (event) => {
        setIntegralLimit(event.target.value);
    };

    const initializePlatformController = async () => {
        controller.start_platform_controller(kp, ki, kd, integralLimit);
        setIsControllerInitialized(true);
    };

    const handlePlatforControllerStop = async () => {
        await controller.stop_platform_controller();
        setIsControllerInitialized(false);
    };

    // Actively brake all platform wheels (short brake), stopping quickly and holding position.
    const handleBrakePlatform = async () => {
        await controller.brake_platform();
    };

    // Coast all platform wheels to a stop (free-wheel, high impedance).
    const handleCoastPlatform = async () => {
        await controller.coast_platform();
    };

    const handleOdometryStart = async () => {
        await controller.start_platform_odometry();
        console.log('Odometry initialized');
        setIsOdometryInitialized(true);
    };

    const handleOdometryStop = async () => {
        await controller.stop_platform_odometry();
        console.log('Odometry stopped');
        setIsOdometryInitialized(false);
    };

    const handleOdometryReset = async () => {
        await controller.reset_platform_odometry();
        console.log('Odometry reset');
    };

    const handleGetOdometry = async () => {
        const odometry = await controller.get_platform_odometry();
        console.log('Odometry:', odometry);
        setOdometry(odometry);
    };

    const handleControllerFrequencyChange = (event) => {
        setControllerFrequency(event.target.value);
    };

    // Set the global controller-loop frequency (Hz, 1-1000).
    const handleSetControllerFrequency = async () => {
        await controller.set_controller_frequency(parseInt(controllerFrequency, 10));
    };

    const handleGetControllerFrequency = async () => {
        const frequency = await controller.get_controller_frequency();
        setControllerFrequency(frequency.toString());
    };

    const handleOdometryFrequencyChange = (event) => {
        setOdometryFrequency(event.target.value);
    };

    // Set the global odometry-loop frequency (Hz, 1-1000).
    const handleSetOdometryFrequency = async () => {
        await controller.set_odometry_frequency(parseInt(odometryFrequency, 10));
    };

    const handleGetOdometryFrequency = async () => {
        const frequency = await controller.get_odometry_frequency();
        setOdometryFrequency(frequency.toString());
    };

    // Handler for initializing the platform
    const initializePlatform = async (platform) => {
        console.log(`Initializing ${platform} platform with reversed motors: ${isReversed[platform]}`);
        if (platformType === 'mecanum'){
            await controller.initialize_mecanum_platform(
                isReversed.mecanum[0],
                isReversed.mecanum[1],
                isReversed.mecanum[2],
                isReversed.mecanum[3],
                isEncoderReversed.mecanum[0],
                isEncoderReversed.mecanum[1],
                isEncoderReversed.mecanum[2],
                isEncoderReversed.mecanum[3],
                mecanumLength,
                mecanumWidth,
                mecanumWheelDiameter,
                encoderResolution);
        } else if (platformType === 'omni'){
            await controller.initialize_omni_platform(
                isReversed.omni[0],
                isReversed.omni[1],
                isReversed.omni[2],
                isEncoderReversed.omni[0],
                isEncoderReversed.omni[1],
                isEncoderReversed.omni[2],
                omniWheelDiameter,
                omniRadius,
                encoderResolution);
        } else if (platformType === 'differential'){
            await controller.initialize_differential_platform(
                isReversed.differential[0],
                isReversed.differential[1],
                isEncoderReversed.differential[0],
                isEncoderReversed.differential[1],
                differentialWheelDiameter,
                differentialWheelBase,
                encoderResolution);
        }else{
            console.log("Invalid platform type");
            return
        }

        setIsPlatformInitialized(true);
    };

    // Handler for setting the platform velocity
    const setPlatformVelocity = async () => {
        console.log(`Setting platform velocity to X:${velocity.x}, Y:${velocity.y}, T:${velocity.t}`);
        await controller.set_platform_velocity(velocity.x, velocity.y, velocity.t);
    };

    const setVelocityTargetHandler = async () => {
        console.log(`Setting platform velocity target to X:${velocityTarget.x}, Y:${velocityTarget.y}, T:${velocityTarget.t}`);
        await controller.set_platform_target_velocity(velocityTarget.x, velocityTarget.y, velocityTarget.t);
    }

    // Compute the desired drive direction (per axis: -1, 0, or +1) from the
    // currently held keys. Magnitude/units are applied later depending on
    // whether the closed-loop controller is active.
    const computeKeyDirections = useCallback(() => {
        const keys = pressedKeys.current;
        const shift = keys.has('shift');
        let x = 0, y = 0, t = 0;

        if (keys.has('w')) x += 1;   // forward
        if (keys.has('s')) x -= 1;   // backward

        if (keys.has('a')) {
            if (shift) y += 1;       // Shift + A -> strafe left
            else t += 1;             // A -> rotate left
        }
        if (keys.has('d')) {
            if (shift) y -= 1;       // Shift + D -> strafe right
            else t -= 1;             // D -> rotate right
        }

        return { x, y, t };
    }, []);

    // Apply the keyboard-derived velocity to the UI state and the controller.
    // When the platform controller is enabled, drive the closed-loop target
    // velocity (m/s, rad/s); otherwise send the open-loop PWM velocity.
    const applyKeyboardVelocity = useCallback(async () => {
        const dir = computeKeyDirections();
        if (isControllerInitialized) {
            const linearSpeed = parseFloat(keyboardTargetSpeed) || 0;
            const angularSpeed = parseFloat(keyboardTargetAngularSpeed) || 0;
            const v = { x: dir.x * linearSpeed, y: dir.y * linearSpeed, t: dir.t * angularSpeed };
            setVelocityTarget(v);
            if (isConnected && controller) {
                await controller.set_platform_target_velocity(v.x, v.y, v.t);
            }
        } else {
            const pwm = Math.max(0, Math.min(100, parseFloat(keyboardPwmSpeed) || 0));
            const v = {
                x: dir.x * pwm,
                y: dir.y * pwm,
                t: dir.t * pwm,
            };
            setVelocity(v);
            if (isConnected && controller) {
                await controller.set_platform_velocity(v.x, v.y, v.t);
            }
        }
    }, [computeKeyDirections, controller, isConnected, isControllerInitialized, keyboardTargetSpeed, keyboardTargetAngularSpeed, keyboardPwmSpeed]);

    // Register global keyboard listeners for WASD driving.
    useEffect(() => {
        if (!keyboardControlEnabled || !isPlatformInitialized) {
            return;
        }

        const driveKeys = ['w', 'a', 's', 'd'];
        // Captured once so the cleanup below acts on the same Set this effect
        // registered its listeners against, rather than re-reading the ref.
        const keysHeld = pressedKeys.current;
        const isTypingTarget = (target) => {
            const tag = target && target.tagName;
            return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
        };

        const handleKeyDown = (event) => {
            if (isTypingTarget(event.target)) return;
            const key = event.key.toLowerCase();

            if (key === 'shift') {
                if (!pressedKeys.current.has('shift')) {
                    pressedKeys.current.add('shift');
                    applyKeyboardVelocity();
                }
                return;
            }

            if (!driveKeys.includes(key)) return;
            event.preventDefault();
            if (pressedKeys.current.has(key)) return; // ignore auto-repeat
            pressedKeys.current.add(key);
            applyKeyboardVelocity();
        };

        const handleKeyUp = (event) => {
            const key = event.key.toLowerCase();
            if (key !== 'shift' && !driveKeys.includes(key)) return;
            pressedKeys.current.delete(key);
            applyKeyboardVelocity();
        };

        // Safety: stop the platform if the window loses focus (keys "stuck").
        const handleBlur = () => {
            if (pressedKeys.current.size === 0) return;
            pressedKeys.current.clear();
            applyKeyboardVelocity();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
            // Stop the platform when keyboard control is turned off/unmounted.
            if (keysHeld.size > 0) {
                keysHeld.clear();
                if (isConnected && controller) {
                    if (isControllerInitialized) {
                        controller.set_platform_target_velocity(0, 0, 0);
                        setVelocityTarget({ x: 0, y: 0, t: 0 });
                    } else {
                        controller.set_platform_velocity(0, 0, 0);
                        setVelocity({ x: 0, y: 0, t: 0 });
                    }
                }
            }
        };
    }, [keyboardControlEnabled, isPlatformInitialized, applyKeyboardVelocity, controller, isConnected, isControllerInitialized]);

    return (
        <div id="tabPlatform" className="platform-tab controllerTab k-row">
            <div className='k-col s12 m6 l4'>
                <h2>Platform Settings</h2>
                <label htmlFor="platformSelector">Platform:</label>
                <select id="platformSelector" value={platformType} onChange={handlePlatformTypeChange}>
                    <option value="mecanum">Mecanum Platform</option>
                    <option value="omni">Omni Platform</option>
                    <option value="differential">Differential Platform</option>
                </select>

                {platformType === 'mecanum' && (
                    <div id="mecanumPlatform">
                        <h2>Mecanum Platform</h2>
                        <div>
                            Motor setup (is reversed):<br/>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <React.Fragment key={index}>
                                    <span className='span-check'>
                                        <label className="checkbox-label" htmlFor={`mecanumPlatformIsReverse${index}`}>{index} </label>
                                        <input
                                            type="checkbox"
                                            className='k-check'
                                            id={`mecanumPlatformIsReverse${index}`} 
                                            checked={isReversed.mecanum[index]} 
                                            onChange={handleReverseChange('mecanum', index)}
                                        />
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <div>
                            Encoder setup (is reversed):<br/>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <React.Fragment key={index}>
                                    <span className='span-check'>
                                        <label className="checkbox-label" htmlFor={`mecanumPlatformEncoderReverse${index}`}>{index} </label>
                                        <input
                                            type="checkbox"
                                            className='k-check'
                                            id={`mecanumPlatformEncoderReverse${index}`}
                                            checked={isEncoderReversed.mecanum[index]}
                                            onChange={handleEncoderReverseChange('mecanum', index)}
                                        />
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <label htmlFor='mecanum_wheel_diameter'>Wheels Diameter (meters)</label>
                        <input type='number' id='mecanum_wheel_diameter' value={mecanumWheelDiameter} onChange={handleMecanumWheelDiameterChange}/>
                        <label htmlFor='mecanum_length'>Platform length (meters)</label>
                        <input type='number' id='mecanum_length' value={mecanumLength} onChange={handleMecanumLengthChange}/>
                        <label htmlFor='mecanum_width'>Platform width (meters)</label>
                        <input type='number' id='mecanum_width' value={mecanumWidth} onChange={handleMecanumWidthChange}/>
                        <label htmlFor='encoderResolution'>Encoder Resolution (ticks/rev):</label>
                        <input type='number' id='encoderResolution' value={encoderResolution} onChange={handleEncoderResolutionChange}/>
                        <button className='k-button k-button-primary' onClick={() => initializePlatform('mecanum')}>Initialize</button><br/>
                    </div>
                )}

                {platformType === 'omni' && (
                    <div id="omniPlatform">
                        <h2>Omni Platform</h2>
                        <div>
                            Motor setup (is reversed):<br/>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <React.Fragment key={index}>
                                    <span className='span-check'>
                                        <label className="checkbox-label" htmlFor={`omniPlatformIsReverse${index}`}>{index} </label>
                                        <input 
                                            type="checkbox"
                                            className='k-check'
                                            id={`omniPlatformIsReverse${index}`} 
                                            checked={isReversed.omni[index]} 
                                            onChange={handleReverseChange('omni', index)}
                                        />
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <div>
                            Encoder setup (is reversed):<br/>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <React.Fragment key={index}>
                                    <span className='span-check'>
                                        <label className="checkbox-label" htmlFor={`omniPlatformEncoderReverse${index}`}>{index} </label>
                                        <input
                                            type="checkbox"
                                            className='k-check'
                                            id={`omniPlatformEncoderReverse${index}`}
                                            checked={isEncoderReversed.omni[index]}
                                            onChange={handleEncoderReverseChange('omni', index)}
                                        />
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <label htmlFor='omni_wheel_diameter'>Wheels Diameter (meters)</label>
                        <input type='number' id='omni_wheel_diameter' value={omniWheelDiameter} onChange={handleOmniWheelDiameterChange}/>
                        <label htmlFor='omni_radius'>Platform radius (meters)</label>
                        <input type='number' id='omni_radius' value={omniRadius} onChange={handleOmniRadiusChange}/>
                        <label htmlFor='encoderResolution'>Encoder Resolution (ticks/rev):</label>
                        <input type='number' id='encoderResolution' value={encoderResolution} onChange={handleEncoderResolutionChange}/>
                        <button className='k-button k-button-primary' onClick={() => initializePlatform('omni')}>Initialize</button><br/>
                    </div>
                )}

                {platformType === 'differential' && (
                    <div id="differentialPlatform">
                        <h2>Differential Platform</h2>
                        <div>
                            Motor setup (is reversed):<br/>
                            {Array.from({ length: 2 }).map((_, index) => (
                                <React.Fragment key={index}>
                                    <span className='span-check'>
                                        <label className="checkbox-label" htmlFor={`differentialPlatformIsReverse${index}`}>{index} </label>
                                        <input
                                            type="checkbox"
                                            className='k-check'
                                            id={`differentialPlatformIsReverse${index}`}
                                            checked={isReversed.differential[index]}
                                            onChange={handleReverseChange('differential', index)}
                                        />
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <div>
                            Encoder setup (is reversed):<br/>
                            {Array.from({ length: 2 }).map((_, index) => (
                                <React.Fragment key={index}>
                                    <span className='span-check'>
                                        <label className="checkbox-label" htmlFor={`differentialPlatformEncoderReverse${index}`}>{index} </label>
                                        <input
                                            type="checkbox"
                                            className='k-check'
                                            id={`differentialPlatformEncoderReverse${index}`}
                                            checked={isEncoderReversed.differential[index]}
                                            onChange={handleEncoderReverseChange('differential', index)}
                                        />
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <label htmlFor='differential_wheel_diameter'>Wheels Diameter (meters)</label>
                        <input type='number' id='differential_wheel_diameter' value={differentialWheelDiameter} onChange={handleDifferentialWheelDiameterChange}/>
                        <label htmlFor='differential_wheel_base'>Wheel base (meters)</label>
                        <input type='number' id='differential_wheel_base' value={differentialWheelBase} onChange={handleDifferentialWheelBaseChange}/>
                        <label htmlFor='encoderResolution'>Encoder Resolution (ticks/rev):</label>
                        <input type='number' id='encoderResolution' value={encoderResolution} onChange={handleEncoderResolutionChange}/>
                        <button className='k-button k-button-primary' onClick={() => initializePlatform('differential')}>Initialize</button><br/>
                    </div>
                )}

                <div className={!isPlatformInitialized ? 'disabled-div' : ''}>
                    <label htmlFor="platformVelocityX">X [-100.0 to 100.0]</label>
                    <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={velocity.x} 
                        step="10" 
                        id="platformVelocityX" 
                        onChange={handleVelocityChange('x')}
                    />
                    <label htmlFor="platformVelocityY">Y [-100.0 to 100.0]</label>
                    <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={velocity.y} 
                        step="10" 
                        id="platformVelocityY" 
                        onChange={handleVelocityChange('y')}
                    />
                    <label htmlFor="platformVelocityT">T [-100.0 to 100.0]</label>
                    <input 
                        type="range" 
                        min="-100" 
                        max="100" 
                        value={velocity.t} 
                        step="10" 
                        id="platformVelocityT" 
                        onChange={handleVelocityChange('t')}
                    />
                    <button className='k-button' onClick={setPlatformVelocity}>Set Platform Velocity</button>
                    <button className='k-button k-button-danger' onClick={handleBrakePlatform}>Brake Platform</button>
                    <button className='k-button' onClick={handleCoastPlatform}>Coast Platform</button>

                    <div className='keyboard-drive'>
                        <span className='span-check'>
                            <label className="checkbox-label" htmlFor="keyboardControlEnabled">Enable keyboard driving</label>
                            <input
                                type="checkbox"
                                className='k-check'
                                id="keyboardControlEnabled"
                                checked={keyboardControlEnabled}
                                onChange={(event) => setKeyboardControlEnabled(event.target.checked)}
                            />
                        </span>
                        <p className='keyboard-drive-hint'>
                            W/S: forward/back &nbsp;|&nbsp; A/D: rotate &nbsp;|&nbsp; Shift + A/D: strafe sideways
                        </p>
                        <p className='keyboard-drive-hint'>
                            Mode: {isControllerInitialized
                                ? 'closed-loop target velocity'
                                : 'open-loop PWM'}
                        </p>
                        {!isControllerInitialized && (
                            <span className='span-check'>
                                <label className="checkbox-label" htmlFor="keyboardPwmSpeed">
                                    Keyboard PWM speed (%, 0-100)
                                </label>
                                <input
                                    type="number"
                                    className='k-input k-border'
                                    id="keyboardPwmSpeed"
                                    step={5}
                                    min={0}
                                    max={100}
                                    value={keyboardPwmSpeed}
                                    onChange={(event) => setKeyboardPwmSpeed(event.target.value)}
                                />
                            </span>
                        )}
                        {isControllerInitialized && (
                            <span className='span-check'>
                                <label className="checkbox-label" htmlFor="keyboardTargetSpeed">
                                    Keyboard linear speed (X/Y, m/s)
                                </label>
                                <input
                                    type="number"
                                    className='k-input k-border'
                                    id="keyboardTargetSpeed"
                                    step={0.05}
                                    min={0}
                                    value={keyboardTargetSpeed}
                                    onChange={(event) => setKeyboardTargetSpeed(event.target.value)}
                                />
                            </span>
                        )}
                        {isControllerInitialized && (
                            <span className='span-check'>
                                <label className="checkbox-label" htmlFor="keyboardTargetAngularSpeed">
                                    Keyboard angular speed (T, rad/s)
                                </label>
                                <input
                                    type="number"
                                    className='k-input k-border'
                                    id="keyboardTargetAngularSpeed"
                                    step={0.1}
                                    min={0}
                                    value={keyboardTargetAngularSpeed}
                                    onChange={(event) => setKeyboardTargetAngularSpeed(event.target.value)}
                                />
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className='k-col s12 m6 l4'>
                <h2>Controller Settings</h2>
                <div>
                    <label htmlFor='controllerFrequency'>Controller Frequency (Hz, 1-1000):</label>
                    <input type='number' id='controllerFrequency' min='1' max='1000' value={controllerFrequency} onChange={handleControllerFrequencyChange}/>
                    <button className='k-button' onClick={handleSetControllerFrequency}>Set Frequency</button>
                    <button className='k-button' onClick={handleGetControllerFrequency}>Get Frequency</button>
                </div>
                <div className={!isPlatformInitialized ? 'disabled-div' : ''}>
                    <label htmlFor='kp'>Kp:</label>
                    <input type='number' id='kp' value={kp} onChange={handleKpChange}/>
                    <label htmlFor='ki'>Ki:</label>
                    <input type='number' id='ki' value={ki} onChange={handleKiChange}/>
                    <label htmlFor='kd'>Kd:</label>
                    <input type='number' id='kd' value={kd} onChange={handleKdChange}/>
                    <label htmlFor='integralLimit'>Integral Limit:</label>
                    <input type='number' id='integralLimit' value={integralLimit} onChange={handleIntegralLimitChange}/>
                    <button className='k-button k-button-primary' onClick={initializePlatformController}>Initialize Platform Controller</button>

                    <div className={!isControllerInitialized ? 'disabled-div' : ''}>
                    <button className='k-button k-button-danger' onClick={handlePlatforControllerStop} disabled={!isControllerInitialized}>Stop Platform Controller</button>
                        <label htmlFor="platformVelocityTargetX">X (m/s)</label>
                        <input type="number" id="platformVelocityTargetX" step={0.1} value={velocityTarget.x} onChange={handleVelocityTargetChange('x')}/>
                        <label htmlFor="platformVelocityTargetY">Y (m/s)</label>
                        <input type="number" id="platformVelocityTargetY" step={0.1} value={velocityTarget.y} onChange={handleVelocityTargetChange('y')}/>
                        <label htmlFor="platformVelocityTargetT">T (radian/s)</label>
                        <input type="number" id="platformVelocityTargetT" step={0.1} value={velocityTarget.t} onChange={handleVelocityTargetChange('t')}/>

                        <button className='k-button' onClick={setVelocityTargetHandler}>Set Platform Velocity Target</button>
                    </div>
                </div>
            </div>
            <div className='k-col s12 m6 l4'>
                <h2>Odometry</h2>
                    <div>
                        <label htmlFor='odometryFrequency'>Odometry Frequency (Hz, 1-1000):</label>
                        <input type='number' id='odometryFrequency' min='1' max='1000' value={odometryFrequency} onChange={handleOdometryFrequencyChange}/>
                        <button className='k-button' onClick={handleSetOdometryFrequency}>Set Frequency</button>
                        <button className='k-button' onClick={handleGetOdometryFrequency}>Get Frequency</button>
                    </div>
                    <div className={!isPlatformInitialized ? 'disabled-div' : ''}>
                    <button className='k-button' onClick={() => handleOdometryStart()} disabled={isOdometryInitialized}>Start Odometry</button>
                    <button className='k-button' onClick={() => handleOdometryReset()} disabled={!isOdometryInitialized}>Reset Odometry</button>
                    <button className='k-button k-button-danger' onClick={() => handleOdometryStop()} disabled={!isOdometryInitialized}>Stop Odometry</button>
                    <button className='k-button' onClick={() => handleGetOdometry()} disabled={!isOdometryInitialized}>Get Odometry</button>
                    <p>Odometry: X: {odometry.x.toFixed(2)}, Y: {odometry.y.toFixed(2)}, Theta: {odometry.t.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
}

export default PlatformTab;
