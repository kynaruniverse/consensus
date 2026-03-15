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
  const route              = useRouter();
  const [user, setUser]    = useState(null);
  // FIX 1: Start as true — never block rendering.
  // Auth state loads in the background and updates nav/UI when ready.
  const [authReady, setAuthReady] = useState(false);
  // FIX 2: homeKey increments every time we navigate to home,
  // forcing Home to remount and re-fetch the feed.
  const [homeKey, setHomeKey] = useState(0);

  useEffect(()=>{
    // Track previous page so we know when we return to home
    let prevPage = route.page;

    const unlisten = ()=>{
      const h = window.location.hash.replace('#','');
      const newPage = h.startsWith('/q/') ? 'question'
        : h === '/post'    ? 'post'
        : h === '/auth'    ? 'auth'
        : h === '/profile' ? 'profile'
        : 'home';
      // If navigating TO home from anywhere, bump the key
      if (newPage === 'home' && prevPage !== 'home') {
        setHomeKey(k => k + 1);
      }
      prevPage = newPage;
    };
    window.addEventListener('hashchange', unlisten);
    return ()=>window.removeEventListener('hashchange', unlisten);
  },[]);

  useEffect(()=>{
    // FIX 3: Always resolve — timeout fallback prevents permanent blank screen
    let resolved = false;
    const resolve = async(session) => {
      if (resolved) return;
      resolved = true;
      if (session?.user) {
        try {
          const { data: profile } = await db.from('profiles')
            .select('*').eq('id', session.user.id).single();
          setUser({ ...session.user,
            username:  profile?.username,
            age_range: profile?.age_range,
            gender:    profile?.gender });
        } catch(_) {
          setUser(session.user);
        }
      }
      setAuthReady(true);
    };

    // Hard timeout — if Supabase takes >4s, show app anyway
    const timeout = setTimeout(()=>{ resolved=true; setAuthReady(true); }, 4000);

    db.auth.getSession()
      .then(({data:{session}})=>{ clearTimeout(timeout); resolve(session); })
      .catch(()=>{ clearTimeout(timeout); resolved=true; setAuthReady(true); });

    // Listen for sign in / sign out events
    const { data:{ subscription } } = db.auth.onAuthStateChange(async(event, session)=>{
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (session?.user) {
        try {
          const { data: profile } = await db.from('profiles')
            .select('*').eq('id', session.user.id).single();
          setUser({ ...session.user,
            username:  profile?.username,
            age_range: profile?.age_range,
            gender:    profile?.gender });
        } catch(_) {
          setUser(session.user);
        }
      }
      setAuthReady(true);
    });

    return ()=>{ clearTimeout(timeout); subscription.unsubscribe(); };
  },[]);

  const handleAuth          = (u)=>{ setUser(u); window.location.hash='/'; };
  const handleSignOut       = ()=>{ setUser(null); window.location.hash='/'; };
  const handleProfileUpdate = (u)=>setUser(u);

  // Show minimal shell while auth resolves (max 4s, usually instant)
  if (!authReady) return div({ style:{minHeight:'100vh',background:'#020817',
    display:'flex',alignItems:'center',justifyContent:'center'} },
    div({ style:{display:'flex',flexDirection:'column',alignItems:'center',gap:12} },
      e('span',{className:'live-dot'}),
      e('p',{style:{color:'#334155',fontSize:14}},'Loading...')
    )
  );

  return div({ style:{minHeight:'100vh',background:'#020817'} },
    e(NavBar, { user }),
    // FIX 2: key={homeKey} forces Home to fully remount on every visit
    route.page==='home'     && e(Home,        { key:homeKey }),
    route.page==='post'     && e(PostPage,     { user }),
    route.page==='question' && e(QuestionPage, { id:route.id, user }),
    route.page==='auth'     && e(AuthPage,     { onAuth:handleAuth }),
    route.page==='profile'  && (
      user
        ? e(ProfilePage, { user, onSignOut:handleSignOut, onProfileUpdate:handleProfileUpdate })
        : e(AuthPage,    { onAuth:handleAuth })
    )
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(e(App, null));
