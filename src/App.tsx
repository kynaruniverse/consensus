import React, { useEffect, Suspense, lazy } from 'react';
import { useRouter } from './lib/router';
import { useMeta } from './hooks/useMeta';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';

import { Sidebar }       from './components/Sidebar';
import { Topbar }        from './components/Topbar';
import { BottomNav }     from './components/BottomNav';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Eagerly loaded (always needed immediately) ────────────────
import { HomePage }  from './pages/Home';
import { FeedPage }  from './pages/Feed';
import { AuthPage }  from './pages/Auth';

// ── Lazily loaded (heavier pages, loaded on demand) ───────────
const PostPage        = lazy(() => import('./pages/Post').then(m => ({ default: m.PostPage })));
const QuestionPage    = lazy(() => import('./pages/Question').then(m => ({ default: m.QuestionPage })));
const ProfilePage     = lazy(() => import('./pages/Profile').then(m => ({ default: m.ProfilePage })));
const DashboardPage   = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.LeaderboardPage })));

// ── Page titles ───────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  home:        "Spitfact — The World's Opinion, Live",
  feed:        'Feed · Spitfact',
  post:        'Ask the World · Spitfact',
  auth:        'Sign In · Spitfact',
  profile:     'Profile · Spitfact',
  dashboard:   'Dashboard · Spitfact',
  leaderboard: 'Leaderboard · Spitfact',
};

// ── Lazy page suspense fallback ───────────────────────────────
const PageFallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '50vh', flexDirection: 'column', gap: 16,
  }}>
    <span className="live-dot" />
    <span style={{ fontSize: 13, color: '#536280', fontFamily: 'Inter, sans-serif' }}>
      Loading…
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────
function App() {
  const route              = useRouter();
  const { setPageMeta }    = useMeta();
  const { user, authReady, signOut, updateUser } = useAuth();

  // Wire up notifications — fires toasts for milestones/comments
  useNotifications(user);

  // Sync page title
  useEffect(() => {
    if (route.page !== 'question') {
      setPageMeta({ title: PAGE_TITLES[route.page] ?? PAGE_TITLES.home });
    }
  }, [route.page, setPageMeta]);

  if (!authReady) return <LoadingScreen />;

  // Auth page — bare centred layout, no chrome
  if (route.page === 'auth') {
    return (
      <ErrorBoundary>
        <AuthPage />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {/* Desktop sidebar */}
      <Sidebar currentPage={route.page} user={user} onSignOut={signOut} />

      {/* Mobile topbar */}
      <Topbar currentPage={route.page} user={user} />

      {/* Main content area */}
      <main
        className="main-content page-pad"
        id="main-content"
        tabIndex={-1} // allows skip-link target
      >
        <Suspense fallback={<PageFallback />}>
          <ErrorBoundary>

            {route.page === 'home'        && <HomePage />}
            {route.page === 'feed'        && <FeedPage />}

            {route.page === 'post'        && <PostPage user={user} />}

            {route.page === 'leaderboard' && <LeaderboardPage />}

            {route.page === 'question'    && (
              <QuestionPage id={route.id ?? ''} user={user} />
            )}

            {route.page === 'profile'     && (
              user
                ? <ProfilePage
                    user={user}
                    onSignOut={signOut}
                    onProfileUpdate={updateUser}
                  />
                : <AuthPage />
            )}

            {route.page === 'dashboard'   && (
              user?.role === 'client'
                ? <DashboardPage user={user} />
                : <AuthPage />
            )}

          </ErrorBoundary>
        </Suspense>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav currentPage={route.page} user={user} />
    </ErrorBoundary>
  );
}

export default App;
