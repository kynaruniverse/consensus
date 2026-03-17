import React from 'react';
import { navigate } from '../lib/router';
import type { Page } from '../lib/router';
import type { Profile } from '../types';

interface Props {
  currentPage: Page;
  user: Profile | null;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { page: 'home'        as Page, icon: '🌍', label: 'Home'        },
  { page: 'feed'        as Page, icon: '📋', label: 'Feed'        },
  { page: 'leaderboard' as Page, icon: '🏆', label: 'Leaderboard' },
  { page: 'post'        as Page, icon: '✏️',  label: 'Ask a Question' },
];

const CLIENT_ITEM = { page: 'dashboard' as Page, icon: '📊', label: 'Dashboard' };

export const Sidebar: React.FC<Props> = ({ currentPage, user, onSignOut }) => {
  const initial = user
    ? (user.username || '?')[0].toUpperCase()
    : null;

  return (
    <aside className="sidebar">

      {/* Logo */}
      <a
        href="#/"
        style={{ textDecoration: 'none', display: 'block', marginBottom: '32px', padding: '4px 6px' }}
      >
        <div className="logo">Spitfact</div>
        <div className="logo-tagline">The World's Opinion, Live</div>
      </a>

      {/* Divider */}
      <div className="divider" style={{ margin: '0 0 12px' }} />

      {/* Main nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <a
            key={item.page}
            href={`#/${item.page === 'home' ? '' : item.page}`}
            className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}

        {/* Client-only dashboard link */}
        {user?.role === 'client' && (
          <>
            <div className="divider" style={{ margin: '8px 0' }} />
            <a
              href="#/dashboard"
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            >
              <span className="nav-icon">{CLIENT_ITEM.icon}</span>
              {CLIENT_ITEM.label}
              <span className="badge badge-gold" style={{ marginLeft: 'auto', fontSize: '9px' }}>
                PRO
              </span>
            </a>
          </>
        )}
      </nav>

      {/* Bottom: user section */}
      <div className="divider" style={{ margin: '16px 0 12px' }} />

      {user ? (
        <div>
          {/* Profile link */}
          <a
            href="#/profile"
            className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
            style={{ marginBottom: '4px' }}
          >
            <div className="avatar avatar-sm">{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: '#F5F5F5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user.username || 'Profile'}
              </div>
              <div style={{ fontSize: '10px', color: '#536280' }}>
                {user.role === 'client' ? '⭐ Pro Account' : 'Free Account'}
              </div>
            </div>
          </a>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="nav-item btn-danger"
            style={{
              width: '100%', border: 'none', cursor: 'pointer',
              background: 'transparent', marginTop: '2px',
            }}
          >
            <span className="nav-icon">🚪</span>
            Sign out
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="#/auth" className="btn btn-gold btn-md" style={{ width: '100%', justifyContent: 'center' }}>
            Sign in
          </a>
          <p style={{ fontSize: '11px', color: '#536280', textAlign: 'center', margin: 0 }}>
            Free · No credit card needed
          </p>
        </div>
      )}

      {/* Version tag */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: '#243F75' }}>v2.0 · spitfact.netlify.app</span>
      </div>
    </aside>
  );
};
