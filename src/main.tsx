import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      gutter={8}
      containerStyle={{ top: 70 }} // clear the topbar on mobile
      toastOptions={{
        // Default style — overridden per-toast where needed
        style: {
          background: 'linear-gradient(145deg, #162E54, #0F2244)',
          border:     '1px solid rgba(212,175,55,0.25)',
          borderRadius: 12,
          color:      '#F5F5F5',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize:   14,
          maxWidth:   360,
          padding:    '12px 16px',
          boxShadow:  '0 8px 32px rgba(0,0,0,0.5)',
        },
        success: {
          iconTheme: { primary: '#D4AF37', secondary: '#0B1E3D' },
          style: {
            background: 'linear-gradient(145deg, #162E54, #0F2244)',
            border:     '1px solid rgba(212,175,55,0.35)',
            borderRadius: 12,
            color:      '#F5F5F5',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize:   14,
            maxWidth:   360,
            padding:    '12px 16px',
          },
        },
        error: {
          iconTheme: { primary: '#f87171', secondary: '#0B1E3D' },
          style: {
            background: 'linear-gradient(145deg, #1E2040, #0F1530)',
            border:     '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            color:      '#F5F5F5',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize:   14,
            maxWidth:   360,
            padding:    '12px 16px',
          },
        },
      }}
    />
  </React.StrictMode>
);
