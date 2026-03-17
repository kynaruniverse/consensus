import React from 'react';
import { navigate } from '../lib/router';
import type { Page } from '../lib/router';
import type { Profile } from '../types';

interface Props {
  currentPage: Page;
  user: Profile | null;
}

// The FAB sits in the centre; items are split left and right around it
const LEFT_ITEMS  = [
  { page: 'home' as Page, icon: '🌍', label: 'Home' },
  { page: 'feed' as Page, icon: '📋', label: 'Feed' },
];
const RIGHT_ITEMS = [
  { page: 'leaderboard' as Page, icon: '🏆', label: 'Rank'    },
  { page: 'profile'     as Page, icon: '👤', label: 'Profile' },
];

export const BottomNav: React.FC<Props> = ({ currentPage, user }) => {
  const handleNav = (page: Page) => {
    if (page === 'profile' && !user) {
      navigate('/auth');
      return;
    }
    if (page === 'home') {
      navigate('/');
    } else {
      navigate(`/${page}`);
    }
  };

  // Show profile avatar initial if signed in
  const initial = user ? (user.username || '?')[0].toUpperCase() : null;

  return (
    <nav className="bottom-nav">

      {/* Left items */}
      {LEFT_ITEMS.map(item => (
        <button
          key={item.page}
          onClick={() => handleNav(item.page)}
          className={`bottom-nav-item ${currentPage === item.page ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </button>
      ))}

      {/* Centre FAB — Ask a question */}
      <button
        onClick={() => navigate('/post')}
        className="fab"
        aria-label="Ask a question"
      >
        ✏️
      </button>

      {/* Right items */}
      {RIGHT_ITEMS.map(item => {
        const isProfile = item.page === 'profile';
        return (
          <button
            key={item.page}
            onClick={() => handleNav(item.page)}
            className={`bottom-nav-item ${currentPage === item.page ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isProfile && initial ? (
              <div
                className="avatar avatar-sm"
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
              <span className="icon">{item.icon}</span>
            )}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
