import React from 'react';
import { navigate } from '../lib/router';
import type { Page } from '../lib/router';
import type { Profile } from '../types';

interface Props {
  currentPage: Page;
  user: Profile | null;
}

export const Topbar: React.FC<Props> = ({ currentPage, user }) => {
  const isInner = currentPage === 'question' || currentPage === 'post';
  const initial = user ? (user.username || '?')[0].toUpperCase() : null;

  return (
    <header className="topbar" style={{ justifyContent: 'space-between' }} role="banner">

      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', left: '-9999px', top: 'auto',
          width: 1, height: 1, overflow: 'hidden',
        }}
        onFocus={e => {
          e.currentTarget.style.left = '16px';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.zIndex = '100';
          e.currentTarget.style.background = '#D4AF37';
          e.currentTarget.style.color = '#0B1E3D';
          e.currentTarget.style.padding = '8px 16px';
          e.currentTarget.style.borderRadius = '8px';
        }}
        onBlur={e => {
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
        }}
      >
        Skip to main content
      </a>

      {/* Left: logo or back */}
      {isInner ? (
        <button
          onClick={() => navigate(currentPage === 'post' ? '/feed' : '/feed')}
          aria-label="Go back to feed"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: '#D4AF37', fontFamily: 'Poppins, sans-serif',
            fontSize: '14px', fontWeight: 600, padding: '4px 0',
          }}
        >
          ← Back
        </button>
      ) : (
        <a href="#/" aria-label="Spitfact home" style={{ textDecoration: 'none' }}>
          <span className="logo logo-sm" aria-hidden="true">Spitfact</span>
        </a>
      )}

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} role="toolbar" aria-label="Page controls">

        {currentPage !== 'feed' && (
          <button
            onClick={() => navigate('/feed')}
            className="btn-icon"
            aria-label="Search polls"
            style={{ fontSize: '16px' }}
          >
            <span aria-hidden="true">🔍</span>
          </button>
        )}

        <button
          className="btn-icon"
          aria-label="Notifications"
          style={{ fontSize: '16px' }}
        >
          <span aria-hidden="true">🔔</span>
        </button>

        {user ? (
          <a
            href="#/profile"
            aria-label={`Profile: ${user.username || 'Account'}`}
            style={{ textDecoration: 'none' }}
          >
            <div className="avatar avatar-sm" aria-hidden="true">{initial}</div>
          </a>
        ) : (
          <a href="#/auth" className="btn btn-gold btn-sm" aria-label="Sign in to your account">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
};
