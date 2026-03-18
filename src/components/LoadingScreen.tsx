import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Ambient glow blobs */}
    <div style={{
      position: 'absolute', top: '-15%', right: '-10%',
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(200,255,0,0.06) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: '-15%', left: '-10%',
      width: 300, height: 300, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,60,110,0.05) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    {/* Logo */}
    <div
      className="logo animate-bounce-in"
      style={{ fontSize: 48 }}
      aria-label="Spitfact"
    >
      Spit<span>fact</span>
    </div>

    {/* Live pulse row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="live-dot" />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        Loading
      </span>
    </div>

    {/* Skeleton bars */}
    <div style={{
      marginTop: 24,
      width: 260,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div className="skeleton" style={{ height: 10, width: '80%',  animationDelay: '0ms'   }} />
      <div className="skeleton" style={{ height: 10, width: '55%',  animationDelay: '120ms' }} />
      <div className="skeleton" style={{ height: 10, width: '70%',  animationDelay: '240ms' }} />
    </div>
  </div>
);
