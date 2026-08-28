import React, { useState, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './GPIOTab.css';

const GPIOModes = ['INPUT_PULLDOWN', 'INPUT_PULLUP', 'INPUT_NOPULL', 'OUTPUT'];

function GPIOTab() {
    const { controller } = useContext(ControllerContext);
    const [gpioStates, setGpioStates] = useState(new Array(8).fill(0));
    const [gpioModes, setGpioModes] = useState(new Array(8).fill(0));
    const [gpioValues, setGpioValues] = useState(new Array(8).fill('unknown'));

    const handleModeChange = async (index, mode) => {
        setGpioModes(modes => {
            const newModes = [...modes];
            newModes[index] = mode;
            return newModes;
        });
        await controller.initialize_gpio_pin(parseInt(index), parseInt(mode));
    };

    const handleStateChange = async (index, state) => {
        setGpioStates(states => {
            const newStates = [...states];
            newStates[index] = state;
            return newStates;
        });
        await controller.set_gpio_pin_state(parseInt(index), parseInt(state));
    };

    const toggleStatusLED = () => {
        controller.toggle_status_led_state(); // Replace with actual controller method
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
            <h2>Status LED</h2>
            <div>
                <button className='k-button k-blue' onClick={toggleStatusLED}>ToggleStatusLED</button>
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
                                    onChange={() => handleModeChange(index, modeIndex)}
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
                            onChange={(e) => handleStateChange(index, parseInt(e.target.value))}
                        /><br/>
                    </div>
                    <div className={`gpioPanel ${mode !== 3 ? '' : 'hidden'}`}>
                        <samp>Value: </samp><div id={`GPIO${index}Value`}>{gpioValues[index]}</div> 
                        <button className='k-button k-blue' id={`buttonGPIO${index}Read`} onClick={() => readGPIO(index)}>Read</button>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}

export default GPIOTab;
