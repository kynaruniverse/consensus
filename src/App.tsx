import React, { useState, useEffect } from 'react';
import { db } from './lib/supabase';
import { useRouter, navigate } from './lib/router';
import { useMeta } from './hooks/useMeta';
import { HomePage } from './pages/Home';
import { FeedPage } from './pages/Feed';
import { PostPage } from './pages/Post';
import { AuthPage } from './pages/Auth';
import { ProfilePage } from './pages/Profile';
import { QuestionPage } from './pages/Question';
import { DashboardPage } from './pages/Dashboard';
import { LeaderboardPage } from './pages/Leaderboard';
import type { Profile } from './types';

function App() {
  const route = useRouter();
  const { setPageMeta } = useMeta();
  const [user, setUser] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        db.from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUser({
                id: session.user.id,
                username: profile.username,
                age_range: profile.age_range,
                gender: profile.gender,
                role: profile.role || 'user'
              });
            }
          });
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = db.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await db
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            setUser({
              id: session.user.id,
              username: profile.username,
              age_range: profile.age_range,
              gender: profile.gender,
              role: profile.role || 'user'
            });
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (route.page !== 'question') {
      const titles = {
        home: 'Spitfact — The World\'s Opinion, Live',
        feed: 'Feed · Spitfact',
        post: 'Ask the World · Spitfact',
        auth: 'Sign In · Spitfact',
        profile: 'Profile · Spitfact',
        dashboard: 'Dashboard · Spitfact',
        leaderboard: 'Leaderboard · Spitfact',
      };
      setPageMeta({ title: titles[route.page] || titles.home });
    }
  }, [route.page, setPageMeta]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="live-dot"></span>
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border1">
        <div className="max-w-[640px] mx-auto px-5 h-[58px] flex items-center justify-between">
          <a href="#/" className="text-2xl font-black tracking-tight no-underline">
            <span className="text-indigo-400">Spit</span>
            <span className="text-slate-100">fact</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="#/feed" className="text-slate-500 hover:text-slate-400 text-sm font-semibold px-2.5 py-1.5 rounded-full no-underline">
              Feed
            </a>
            <a href="#/leaderboard" className="text-slate-500 hover:text-slate-400 text-sm font-semibold px-2.5 py-1.5 rounded-full no-underline">
              🏆 Rank
            </a>
            {user?.role === 'client' && (
              <a href="#/dashboard" 
                 className="text-indigo-400 text-sm font-semibold px-2.5 py-1.5 rounded-full no-underline border border-indigo-400/30">
                📊 Dashboard
              </a>
            )}
            <a href="#/post" 
               className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold no-underline shadow-lg shadow-indigo-500/30">
              + Ask
            </a>
            {user ? (
              <a href="#/profile" 
                 className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center text-sm font-black text-white no-underline">
                {(user.username || user.email || '?')[0].toUpperCase()}
              </a>
            ) : (
              <a href="#/auth" className="text-slate-500 text-sm font-semibold no-underline">
                Sign in
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-[58px]">
        {route.page === 'home' && <HomePage />}
        {route.page === 'feed' && <FeedPage />}
        {route.page === 'post' && <PostPage user={user} />}
        {route.page === 'question' && <QuestionPage id={route.id || ''} user={user} />}
        {route.page === 'auth' && <AuthPage />}
        {route.page === 'leaderboard' && <LeaderboardPage />}
        {route.page === 'profile' && user ? (
          <ProfilePage 
            user={user} 
            onSignOut={() => setUser(null)} 
            onProfileUpdate={(updated) => setUser(updated)} 
          />
        ) : <AuthPage />}
        {route.page === 'dashboard' && (user?.role === 'client' ? <DashboardPage user={user} /> : <AuthPage />)}
      </div>
    </div>
  );
}

export default App;
