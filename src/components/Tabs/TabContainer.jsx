import { useState, Children, useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import './Tabs.css';
import '../Common.css';

/**
 * App shell body: a left sidebar listing the sections, plus the panel for the
 * selected one.
 *
 * A child marked `alwaysEnabled` works without a controller (the Connection
 * section). Every other section is inert until one is connected, so it is
 * disabled in the sidebar rather than merely faded — a disabled control
 * explains itself to assistive tech, which `pointer-events: none` does not.
 */
function TabContainer({ children }) {
    const [activeTab, setActiveTab] = useState(0);
    const [lastWorked, setLastWorked] = useState(-1);
    const [wasConnected, setWasConnected] = useState(false);
    const { isConnected } = useContext(ControllerContext);

    const sections = Children.toArray(children);
    const isLocked = (section) => !isConnected && !section.props.alwaysEnabled;

    const select = (index) => {
        setActiveTab(index);
        // Remembered so connecting can hand back the section the user was
        // working in, however they got to the Connection section afterwards.
        if (!sections[index].props.alwaysEnabled) {
            setLastWorked(index);
        }
    };

    // Connecting is a means, not an end: once there is a controller, move off
    // the Connection section and open something worth looking at — whatever
    // was last in use, or the first controller section on a cold start.
    if (isConnected !== wasConnected) {
        setWasConnected(isConnected);
        if (isConnected && sections[activeTab].props.alwaysEnabled) {
            const target =
                lastWorked >= 0
                    ? lastWorked
                    : sections.findIndex((section) => !section.props.alwaysEnabled);
            if (target >= 0) {
                setActiveTab(target);
            }
        }
    }

    // If the link drops while a controller section is open, fall back to the
    // first section that works without one. Derived rather than pushed through
    // an effect so the locked panel is never painted.
    const shown = isLocked(sections[activeTab])
        ? sections.findIndex((section) => !isLocked(section))
        : activeTab;

    return (
        <>
            <aside className="app-sidebar">
                <h2 className="sidebar-heading">Sections</h2>
                <nav className="sidebar-nav" aria-label="Sections">
                    {sections.map((section, index) => (
                        <button
                            key={section.props.title}
                            type="button"
                            className={`sidebar-nav-item ${index === shown ? 'active' : ''}`}
                            aria-current={index === shown ? 'page' : undefined}
                            disabled={isLocked(section)}
                            title={
                                isLocked(section)
                                    ? 'Connect to the controller first'
                                    : undefined
                            }
                            onClick={() => select(index)}
                        >
                            {section.props.title}
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="app-main">
                <h1 className="app-main-title">{sections[shown].props.title}</h1>
                {sections[shown]}
            </main>
        </>
    );
}

export default TabContainer;