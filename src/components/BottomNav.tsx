import React from 'react';
import { navigate } from '../lib/router';
import type { Page } from '../lib/router';
import type { Profile } from '../types';

interface Props {
  currentPage: Page;
  user: Profile | null;
}

const LEFT_ITEMS = [
  { page: 'home' as Page, icon: '🌍', label: 'Home' },
  { page: 'feed' as Page, icon: '📋', label: 'Feed' },
];
const RIGHT_ITEMS = [
  { page: 'leaderboard' as Page, icon: '🏆', label: 'Rank'    },
  { page: 'profile'     as Page, icon: '👤', label: 'Profile' },
];

export const BottomNav: React.FC<Props> = ({ currentPage, user }) => {
  const handleNav = (page: Page) => {
    if (page === 'profile' && !user) { navigate('/auth'); return; }
    navigate(page === 'home' ? '/' : `/${page}`);
  };

  const initial = user ? (user.username || '?')[0].toUpperCase() : null;

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">

      {LEFT_ITEMS.map(item => (
        <button
          key={item.page}
          onClick={() => handleNav(item.page)}
          className={`bottom-nav-item ${currentPage === item.page ? 'active' : ''}`}
          aria-label={item.label}
          aria-current={currentPage === item.page ? 'page' : undefined}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span className="icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      {/* Centre FAB */}
      <button
        onClick={() => navigate('/post')}
        className="fab"
        aria-label="Ask a new question"
      >
        <span aria-hidden="true">✏️</span>
      </button>

      {RIGHT_ITEMS.map(item => {
        const isProfile = item.page === 'profile';
        return (
          <button
            key={item.page}
            onClick={() => handleNav(item.page)}
            className={`bottom-nav-item ${currentPage === item.page ? 'active' : ''}`}
            aria-label={isProfile && user ? `Profile: ${user.username}` : item.label}
            aria-current={currentPage === item.page ? 'page' : undefined}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isProfile && initial ? (
              <div
                className="avatar avatar-sm"
                aria-hidden="true"
                style={{
                  width: '22px', height: '22px', fontSize: '10px',
                  border: currentPage === 'profile'
                    ? '2px solid #D4AF37'
                    : '2px solid rgba(212,175,55,0.3)',
                }}
              >
                {initial}
              </div>
            ) : (
              <span className="icon" aria-hidden="true">{item.icon}</span>
            )}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
