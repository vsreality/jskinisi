import React from 'react';
import ReactDOM from 'react-dom/client';
// Imported before index.css so local styles keep overriding the base utilities.
import './styles/ui.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
