// API-v2 actions display controller errors and await command acknowledgements.
import { useCommandAction } from '../../hooks/useCommandAction';
import React, { useState, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './GPIOTab.css';

const GPIOModes = ['INPUT_PULLDOWN', 'INPUT_PULLUP', 'INPUT_NOPULL', 'OUTPUT'];

function GPIOTab() {
    const [commandError, runCommand] = useCommandAction();
    const { controller } = useContext(ControllerContext);
    const [gpioStates, setGpioStates] = useState(new Array(8).fill(0));
    const [gpioModes, setGpioModes] = useState(new Array(8).fill(0));
    const [gpioValues, setGpioValues] = useState(new Array(8).fill('unknown'));

    const handleModeChange = async (index, mode) => {
        await controller.initialize_gpio_pin(parseInt(index), parseInt(mode));
        setGpioModes(modes => {
            const newModes = [...modes];
            newModes[index] = mode;
            return newModes;
        });
    };

    const handleStateChange = async (index, state) => {
        await controller.set_gpio_pin_state(parseInt(index), parseInt(state));
        setGpioStates(states => {
            const newStates = [...states];
            newStates[index] = state;
            return newStates;
        });
    };

    const toggleStatusLED = async () => {
        await controller.toggle_status_led_state(); // Replace with actual controller method
    };

    const readGPIO = async (index) => {
        // Logic to read GPIO value using controller
        const value = await controller.get_gpio_pin_state(index); // Replace with actual controller method
        setGpioValues(values => {
            const newValues = [...values];
            newValues[index] = value;
            return newValues;
        });
    };

    return (
        <div id="tabGPIO" className="controllerTab k-panel">
            {commandError && <p className="conn-error" role="alert">{commandError}</p>}
            <h2>Status LED</h2>
            <div>
                <button className='k-button' onClick={() => runCommand(toggleStatusLED)}>Toggle Status LED</button>
            </div>
            <hr/>
            <h2>GPIO Pins</h2>
            <div className='gpio-container'>
            {gpioModes.map((mode, index) => (
                <div key={index} id={`GPIO${index}`} className="gpio-div">
                    <h3>GPIO {index}</h3>
                    <samp>Mode:</samp>
                    {GPIOModes.map((m, modeIndex) => (
                        <React.Fragment key={modeIndex}>
                            <div>
                                <input
                                    type="radio"
                                    id={`GPIO${index}Mode${m}`} 
                                    name={`GPIO${index}Mode`} 
                                    value={modeIndex} 
                                    checked={mode === modeIndex} 
                                    onChange={() => runCommand(() => handleModeChange(index, modeIndex))}
                                />
                                <label htmlFor={`GPIO${index}Mode${m}`}>{m}</label>
                            </div>
                        </React.Fragment>
                    ))}
                    <div className={`gpioPanel ${mode === 3 ? '' : 'hidden'}`}>
                        <label htmlFor={`GPIO${index}State`}>State</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            value={gpioStates[index]}
                            step="1" 
                            id={`GPIO${index}State`} 
                            onChange={(e) => runCommand(() => handleStateChange(index, parseInt(e.target.value)))}
                        /><br/>
                    </div>
                    <div className={`gpioPanel ${mode !== 3 ? '' : 'hidden'}`}>
                        <samp>Value: </samp><div id={`GPIO${index}Value`}>{gpioValues[index]}</div> 
                        <button className='k-button' id={`buttonGPIO${index}Read`} onClick={() => runCommand(() => readGPIO(index))}>Read</button>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}

export default GPIOTab;
