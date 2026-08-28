import { useState, Children, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './Tabs.css';
import '../Common.css';

function TabContainer({ children }) {
    const [activeTab, setActiveTab] = useState(0);
    const { isConnected } = useContext(ControllerContext);

    return (
        <div className={`${!isConnected ? 'disabled-div' : ''}`}>
            <div className='k-bar k-black'>
                {Children.map(children, (child, index) => (
                    <div
                        className={`k-bar-item k-hover-green k-button ${index === activeTab ? 'active' : ''}`}
                        onClick={() => setActiveTab(index)}
                    >
                        {child.props.title}
                    </div>
                ))}
            </div>
            <div className="tab-content">
                {Children.toArray(children)[activeTab]}
            </div>
        </div>
    ); 
}

export default TabContainer;