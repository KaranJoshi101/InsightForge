import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import './tailwind.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ToastProvider>
        <App />
        <ToastContainer />
      </ToastProvider>
    </HelmetProvider>
  </React.StrictMode>
);
