import React, { useState } from 'react';
import { navigate } from '../lib/router';
import type { Page } from '../lib/router';
import type { Profile } from '../types';

interface Props {
  currentPage: Page;
  user: Profile | null;
}

export const Topbar: React.FC<Props> = ({ currentPage, user }) => {
  // Show back button on inner pages instead of logo
  const isInner = currentPage === 'question' || currentPage === 'post';

  const initial = user
    ? (user.username || '?')[0].toUpperCase()
    : null;

  return (
    <header className="topbar" style={{ justifyContent: 'space-between' }}>

      {/* Left: logo or back */}
      {isInner ? (
        <button
          onClick={() => navigate(currentPage === 'post' ? '/feed' : '/')}
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
        <a href="#/" style={{ textDecoration: 'none' }}>
          <span className="logo logo-sm">Spitfact</span>
        </a>
      )}

      {/* Right: search hint + profile/auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Search button (navigates to feed with focus) */}
        {currentPage !== 'feed' && (
          <button
            onClick={() => navigate('/feed')}
            className="btn-icon"
            style={{ fontSize: '16px' }}
            aria-label="Search"
          >
            🔍
          </button>
        )}

        {/* Notifications placeholder */}
        <div style={{ position: 'relative' }}>
          <button className="btn-icon" aria-label="Notifications" style={{ fontSize: '16px' }}>
            🔔
          </button>
          {/* Badge — will be wired up in Phase 6 */}
        </div>

        {/* Profile / sign in */}
        {user ? (
          <a
            href="#/profile"
            style={{ textDecoration: 'none' }}
            aria-label="Profile"
          >
            <div className="avatar avatar-sm">{initial}</div>
          </a>
        ) : (
          <a href="#/auth" className="btn btn-gold btn-sm">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
};
