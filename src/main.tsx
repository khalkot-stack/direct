import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // React.StrictMode is disabled to prevent 'Map container is already initialized' error in development.
  // This is a common workaround for react-leaflet in development environments.
  // It does not affect production builds.
  <App />
);