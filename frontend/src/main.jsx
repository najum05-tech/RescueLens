import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AppProvider } from './context/AppContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppProvider>
          <App />
          <Toaster position="bottom-right" toastOptions={{ duration: 2500, style: { fontSize: 13, border: '1px solid #E5EAF0', color: '#14243A' } }} />
        </AppProvider>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>
);
