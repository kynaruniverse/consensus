// js/app.js
import { e, div, db }           from './db.js';
import { NavBar }                from './nav.js';
import { Home }                  from './home.js';
import { PostPage }              from './post.js';
import { QuestionPage }          from './question.js';
import { AuthPage, ProfilePage } from './auth.js';

const { useState, useEffect } = React;

// ── Router ────────────────────────────────────────────────────
const useRouter = () => {
  const parse = () => {
    const h = window.location.hash.replace('#','');
    if (h.startsWith('/q/')) return { page:'question', id:h.slice(3) };
    if (h === '/post')       return { page:'post' };
    if (h === '/auth')       return { page:'auth' };
    if (h === '/profile')    return { page:'profile' };
    return { page:'home' };
  };
  const [route, setRoute] = useState(parse);
  useEffect(()=>{
    const fn = ()=>setRoute(parse());
    window.addEventListener('hashchange', fn);
    return ()=>window.removeEventListener('hashchange', fn);
  },[]);
  return route;
};

// ── App ───────────────────────────────────────────────────────
const App = () => {
  const route               = useRouter();
  const [user, setUser]     = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [homeKey, setHomeKey]     = useState(0);

  // Bump homeKey whenever we navigate back to home so feed re-fetches
  useEffect(()=>{
    let prev = route.page;
    const fn = ()=>{
      const h = window.location.hash.replace('#','');
      const next = h.startsWith('/q/') ? 'question'
        : h==='/post' ? 'post' : h==='/auth' ? 'auth'
        : h==='/profile' ? 'profile' : 'home';
      if (next==='home' && prev!=='home') setHomeKey(k=>k+1);
      prev = next;
    };
    window.addEventListener('hashchange', fn);
    return ()=>window.removeEventListener('hashchange', fn);
  },[]);

  // ── Auth: use onAuthStateChange exclusively ───────────────
  // Supabase fires INITIAL_SESSION on every page load with the
  // persisted session from localStorage — no need for getSession.
  // This is the only source of truth for auth state.
  useEffect(()=>{
    // Safety net: if Supabase never fires, show app after 3s
    const timeout = setTimeout(()=>setAuthReady(true), 3000);

    const { data:{ subscription } } = db.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(timeout);

        if (session?.user) {
          try {
            const { data: profile } = await db.from('profiles')
              .select('*').eq('id', session.user.id).single();
            setUser({
              ...session.user,
              username:  profile?.username  || null,
              age_range: profile?.age_range || null,
              gender:    profile?.gender    || null,
            });
          } catch(_) {
            // Profile fetch failed — set user without profile data
            setUser(session.user);
          }
        } else {
          setUser(null);
        }

        setAuthReady(true);
      }
    );

    return ()=>{ clearTimeout(timeout); subscription.unsubscribe(); };
  },[]);

  const handleSignOut       = ()=>{ db.auth.signOut(); };
  const handleProfileUpdate = (u)=>setUser(u);

  if (!authReady) return div({
    style:{minHeight:'100vh',background:'#020817',
      display:'flex',alignItems:'center',justifyContent:'center'}},
    div({style:{display:'flex',flexDirection:'column',alignItems:'center',gap:12}},
      e('span',{className:'live-dot'}),
      e('p',{style:{color:'#334155',fontSize:14}},'Loading...')
    )
  );

  return div({ style:{minHeight:'100vh',background:'#020817'} },
    e(NavBar, { user }),
    route.page==='home'     && e(Home,        { key:homeKey }),
    route.page==='post'     && e(PostPage,     { user }),
    route.page==='question' && e(QuestionPage, { id:route.id, user }),
    route.page==='auth'     && e(AuthPage,     null),
    route.page==='profile'  && (
      user
        ? e(ProfilePage, { user, onSignOut:handleSignOut, onProfileUpdate:handleProfileUpdate })
        : e(AuthPage,    null)
    )
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(e(App, null));
