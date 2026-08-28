import './App.css';
import Connection from './components/Connection/Connection'
import TabContainer from './components/Tabs/TabContainer'
import MotorTab from './components/MotorTab/MotorTab'
import PlatformTab from './components/PlatfirmTab/PlatfirmTab'
import GPIOTab from './components/GPIOTab/GPIOTab';
import ControllerProvider from './contexts/ControllerProvider';
import MotorControllerTab from './components/MotorControllerTab/MotorControllerTab';

function App() {

  return (
    <ControllerProvider>
    <div className="App">
      <header>
        Kinisi motor controller
      </header>
      <Connection/>
      <TabContainer>
        <MotorTab title="Motor"></MotorTab>
        <PlatformTab title="Platform"></PlatformTab>
        <GPIOTab title="GPIO"></GPIOTab>
        <MotorControllerTab title="Motor Controller"></MotorControllerTab>
      </TabContainer>
    </div>
    <footer>
      VsReality
    </footer>
    </ControllerProvider>
  );
}

export default App;
