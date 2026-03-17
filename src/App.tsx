import React, { useEffect } from 'react';
import { useRouter } from './lib/router';
import { useMeta } from './hooks/useMeta';
import { useAuth } from './hooks/useAuth';

import { Sidebar }      from './components/Sidebar';
import { Topbar }       from './components/Topbar';
import { BottomNav }    from './components/BottomNav';
import { LoadingScreen } from './components/LoadingScreen';

import { HomePage }      from './pages/Home';
import { FeedPage }      from './pages/Feed';
import { PostPage }      from './pages/Post';
import { AuthPage }      from './pages/Auth';
import { ProfilePage }   from './pages/Profile';
import { QuestionPage }  from './pages/Question';
import { DashboardPage } from './pages/Dashboard';
import { LeaderboardPage } from './pages/Leaderboard';

// Pages that don't use the standard chrome (no sidebar/nav)
const BARE_PAGES = ['auth'] as const;

const PAGE_TITLES: Record<string, string> = {
  home:        "Spitfact — The World's Opinion, Live",
  feed:        'Feed · Spitfact',
  post:        'Ask the World · Spitfact',
  auth:        'Sign In · Spitfact',
  profile:     'Profile · Spitfact',
  dashboard:   'Dashboard · Spitfact',
  leaderboard: 'Leaderboard · Spitfact',
};

function App() {
  const route              = useRouter();
  const { setPageMeta }    = useMeta();
  const { user, authReady, signOut, updateUser } = useAuth();

  // Page title sync
  useEffect(() => {
    if (route.page !== 'question') {
      setPageMeta({ title: PAGE_TITLES[route.page] ?? PAGE_TITLES.home });
    }
  }, [route.page, setPageMeta]);

  if (!authReady) return <LoadingScreen />;

  // Bare layout — auth page sits alone, centred, no chrome
  if ((BARE_PAGES as readonly string[]).includes(route.page)) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <AuthPage />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* === DESKTOP SIDEBAR === */}
      <Sidebar
        currentPage={route.page}
        user={user}
        onSignOut={signOut}
      />

      {/* === MOBILE TOPBAR === */}
      <Topbar currentPage={route.page} user={user} />

      {/* === MAIN CONTENT === */}
      <main className="main-content page-pad">
        {route.page === 'home'        && <HomePage />}
        {route.page === 'feed'        && <FeedPage />}
        {route.page === 'post'        && <PostPage user={user} />}
        {route.page === 'leaderboard' && <LeaderboardPage />}

        {route.page === 'question' && (
          <QuestionPage id={route.id ?? ''} user={user} />
        )}

        {route.page === 'profile' && (
          user
            ? <ProfilePage
                user={user}
                onSignOut={signOut}
                onProfileUpdate={updateUser}
              />
            : <AuthPage />
        )}

        {route.page === 'dashboard' && (
          user?.role === 'client'
            ? <DashboardPage user={user} />
            : <AuthPage />
        )}
      </main>

      {/* === MOBILE BOTTOM NAV === */}
      <BottomNav currentPage={route.page} user={user} />

    </div>
  );
}

export default App;
