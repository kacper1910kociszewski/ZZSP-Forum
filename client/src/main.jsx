import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

// Apply the saved theme (default: dark) before first paint so there is no flash.
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const next = saved === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
