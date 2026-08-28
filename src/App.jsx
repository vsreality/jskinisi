import './App.css';
import Connection from './components/Connection/Connection'
import ConnectionStatus from './components/Connection/ConnectionStatus'
import TabContainer from './components/Tabs/TabContainer'
import MotorTab from './components/MotorTab/MotorTab'
import PlatformTab from './components/PlatfirmTab/PlatfirmTab'
import GPIOTab from './components/GPIOTab/GPIOTab';
import ControllerProvider from './contexts/ControllerProvider';
import MotorControllerTab from './components/MotorControllerTab/MotorControllerTab';

const REPO_URL = 'https://github.com/vsreality/jskinisi';
const SITE_URL = 'https://vsreality.com';
const DOCS_URL = 'https://vsreality.com/docs/kinisi-motor-controller/commands';

// Inlined rather than loaded as an <img>: the build ships a strict CSP and an
// inline <svg> needs no additional img-src/network allowance.
function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="28" height="28" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

function App() {

  return (
    <ControllerProvider>
    <div className="App">
      <header className="app-header">
        <span className="app-title">Kinisi motor controller</span>
        <div className="app-header-meta">
          <ConnectionStatus />
          <a
            className="repo-link"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source code on GitHub"
            title="Source code on GitHub"
          >
            <GitHubIcon />
          </a>
        </div>
      </header>
      <div className="app-body">
        <TabContainer>
          <Connection title="Connection" alwaysEnabled></Connection>
          <MotorTab title="Motor"></MotorTab>
          <PlatformTab title="Platform"></PlatformTab>
          <GPIOTab title="GPIO"></GPIOTab>
          <MotorControllerTab title="Motor Controller"></MotorControllerTab>
        </TabContainer>
      </div>
    </div>
    <footer className="app-footer">
      <div className="app-footer-inner">
        <a
          className="site-link"
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          VsReality
        </a>
        <nav className="app-footer-links" aria-label="Footer">
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>
      <div className="app-footer-legal">
        Kinisi motor controller web client &middot; &copy;{' '}
        {new Date().getFullYear()} VsReality
      </div>
    </footer>
    </ControllerProvider>
  );
}

export default App;
