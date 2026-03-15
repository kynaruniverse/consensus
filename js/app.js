// js/app.js
// Entry point — router + auth state + root render
import { e, div, db }        from './db.js';
import { NavBar }             from './nav.js';
import { Home }               from './home.js';
import { PostPage }           from './post.js';
import { QuestionPage }       from './question.js';
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
  const route        = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Restore session on load
  useEffect(()=>{
    db.auth.getSession().then(async({data:{session}})=>{
      if (session?.user) {
        const { data: profile } = await db.from('profiles').select('*').eq('id', session.user.id).single();
        setUser({ ...session.user, username: profile?.username, age_range: profile?.age_range, gender: profile?.gender });
      }
      setAuthChecked(true);
    });

    // Listen for auth changes (e.g. email confirmation in another tab)
    const { data: { subscription } } = db.auth.onAuthStateChange(async(event, session)=>{
      if (session?.user) {
        const { data: profile } = await db.from('profiles').select('*').eq('id', session.user.id).single();
        setUser({ ...session.user, username: profile?.username, age_range: profile?.age_range, gender: profile?.gender });
      } else {
        setUser(null);
      }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // Don't render until we've checked for an existing session
  if (!authChecked) return div({style:{minHeight:'100vh',background:'#020817'}});

  const handleAuth    = (u)=>{ setUser(u); window.location.hash='/'; };
  const handleSignOut = ()=>{ setUser(null); window.location.hash='/'; };
  const handleProfileUpdate = (u)=>setUser(u);

  return div({ style:{minHeight:'100vh',background:'#020817'} },
    e(NavBar, { user }),
    route.page==='home'     && e(Home, null),
    route.page==='post'     && e(PostPage, { user }),
    route.page==='question' && e(QuestionPage, { id:route.id, user }),
    route.page==='auth'     && e(AuthPage, { onAuth:handleAuth }),
    route.page==='profile'  && (
      user
        ? e(ProfilePage, { user, onSignOut:handleSignOut, onProfileUpdate:handleProfileUpdate })
        : e(AuthPage, { onAuth:handleAuth })
    )
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(e(App, null));
