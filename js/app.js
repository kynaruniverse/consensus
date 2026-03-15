// js/app.js
import { e, div, db }           from './db.js';
import { NavBar }                from './nav.js';
import { Home }                  from './home.js';
import { PostPage }              from './post.js';
import { QuestionPage }          from './question.js';
import { AuthPage, ProfilePage } from './auth.js';

const { useState, useEffect } = React;

const SITE_URL  = 'https://kynaruniverse.github.io/consensus';
const SITE_NAME = 'Consensus';
const DEFAULT_DESC = 'Vote on anything. See live results from around the planet.';
const DEFAULT_IMG  = SITE_URL + '/og-default.png';

// ── setPageMeta ───────────────────────────────────────────────
// Call this from any page to update the browser tab title,
// meta description, and all Open Graph / Twitter card tags.
// Google's crawler executes JS and reads these — so even with
// hash routing each question page gets unique metadata.
export const setPageMeta = ({ title, description, url, image } = {}) => {
  const t   = title       || SITE_NAME + ' — The World\'s Opinion, Live';
  const d   = description || DEFAULT_DESC;
  const u   = url         || SITE_URL + '/';
  const img = image       || DEFAULT_IMG;

  // Browser tab title
  document.title = t;

  // Helper: get or create a meta tag
  const setMeta = (sel, attr, val) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };

  setMeta('meta[name="description"]',         'content', d);
  setMeta('meta[property="og:title"]',        'content', t);
  setMeta('meta[property="og:description"]',  'content', d);
  setMeta('meta[property="og:url"]',          'content', u);
  setMeta('meta[property="og:image"]',        'content', img);
  setMeta('meta[name="twitter:title"]',       'content', t);
  setMeta('meta[name="twitter:description"]', 'content', d);
  setMeta('meta[name="twitter:image"]',       'content', img);

  // Canonical URL
  let canon = document.querySelector('link[rel="canonical"]');
  if (!canon) { canon = document.createElement('link'); canon.rel='canonical'; document.head.appendChild(canon); }
  canon.href = u;
};

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
  const route                     = useRouter();
  const [user, setUser]           = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [homeKey, setHomeKey]     = useState(0);

  // Reset meta to defaults when navigating to non-question pages
  useEffect(()=>{
    if (route.page !== 'question') {
      const titles = {
        home:    SITE_NAME + ' — The World\'s Opinion, Live',
        post:    'Ask the World · ' + SITE_NAME,
        auth:    'Sign In · ' + SITE_NAME,
        profile: 'Profile · ' + SITE_NAME,
      };
      setPageMeta({ title: titles[route.page] || titles.home });
    }
  },[route.page]);

  // Bump homeKey when navigating back to home
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

  // Auth — onAuthStateChange only (INITIAL_SESSION fires on load)
  useEffect(()=>{
    const timeout = setTimeout(()=>setAuthReady(true), 3000);
    const { data:{ subscription } } = db.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(timeout);
        if (session?.user) {
          try {
            const { data: profile } = await db.from('profiles')
              .select('*').eq('id', session.user.id).single();
            setUser({ ...session.user,
              username:  profile?.username  || null,
              age_range: profile?.age_range || null,
              gender:    profile?.gender    || null });
          } catch(_) { setUser(session.user); }
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
