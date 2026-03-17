import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      background: 'radial-gradient(ellipse at 20% 0%, #102548 0%, #0B1E3D 50%, #080F1E 100%)',
    }}
  >
    {/* Animated logo */}
    <div className="logo animate-bounce-in" style={{ fontSize: '36px' }}>
      Spitfact
    </div>

    {/* Live pulse */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span className="live-dot" />
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#536280',
        letterSpacing: '0.05em',
      }}>
        Loading...
      </span>
    </div>

    {/* Skeleton bars */}
    <div
      style={{
        marginTop: '32px',
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div className="skeleton" style={{ height: '12px', width: '80%'  }} />
      <div className="skeleton" style={{ height: '12px', width: '60%'  }} />
      <div className="skeleton" style={{ height: '12px', width: '70%'  }} />
    </div>
  </div>
);
