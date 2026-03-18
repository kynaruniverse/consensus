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

      {/* Skip link */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', left: '-9999px', top: 'auto',
          width: 1, height: 1, overflow: 'hidden',
        }}
        onFocus={e => {
          e.currentTarget.style.cssText =
            'left:16px;width:auto;height:auto;z-index:100;background:var(--acid);color:#0a0a0f;padding:8px 16px;border-radius:8px;font-weight:700;';
        }}
        onBlur={e => {
          e.currentTarget.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
        }}
      >
        Skip to main content
      </a>

      {/* Left */}
      {isInner ? (
        <button
          onClick={() => navigate('/feed')}
          aria-label="Go back to feed"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--acid)', fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 700, padding: '4px 0',
            letterSpacing: '0.02em',
          }}
        >
          ← Back
        </button>
      ) : (
        <a href="#/" aria-label="Spitfact home" style={{ textDecoration: 'none' }}>
          <span className="logo logo-sm" aria-hidden="true">
            Spit<span>fact</span>
          </span>
        </a>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} role="toolbar">

        {currentPage !== 'feed' && (
          <button
            onClick={() => navigate('/feed')}
            className="btn-icon"
            aria-label="Search polls"
          >
            <span aria-hidden="true">🔍</span>
          </button>
        )}

        <button className="btn-icon" aria-label="Notifications" style={{ position: 'relative' }}>
          <span aria-hidden="true">🔔</span>
        </button>

        {user ? (
          <a href="#/profile" aria-label={`Profile: ${user.username}`} style={{ textDecoration: 'none' }}>
            <div className="avatar avatar-sm" aria-hidden="true">{initial}</div>
          </a>
        ) : (
          <a
            href="#/auth"
            className="btn btn-gold btn-sm"
            aria-label="Sign in"
            style={{ textDecoration: 'none', borderRadius: 'var(--radius-md)' }}
          >
            Sign in
          </a>
        )}
      </div>
    </header>
  );
};
