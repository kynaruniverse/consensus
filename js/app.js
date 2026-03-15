// js/app.js
// ─────────────────────────────────────────────────────────────────
// Root: React Router v6 (hash mode), Error Boundary, Toast system,
//       auth state, and page meta management.
// ─────────────────────────────────────────────────────────────────
import { db } from './db.js';
import { NavBar } from './nav.js';
import { BottomNav } from './bottomnav.js';
import { Home, FeedPage } from './home.js';
import { PostPage } from './post.js';
import { QuestionPage } from './question.js';
import { AuthPage, ProfilePage } from './auth.js';

const { useState, useEffect, useCallback, createContext, useContext, useRef, Component } = React;
const { HashRouter, Routes, Route, useParams, useNavigate, Navigate } = ReactRouterDOM;

// ── Site constants ────────────────────────────────────────────────
const SITE_URL = 'https://spitfact.netlify.app';
const SITE_NAME = 'Spitfact';
const DEFAULT_DESC = 'Vote on anything. See live results from around the planet.';
const DEFAULT_IMG = SITE_URL + '/og-default.png';

// ── Page meta helper ──────────────────────────────────────────────
export const setPageMeta = ({ title, description, url, image } = {}) => {
  const t = title || SITE_NAME + ' — The World\'s Opinion, Live';
  const d = description || DEFAULT_DESC;
  const u = url || SITE_URL + '/';
  const img = image || DEFAULT_IMG;
  
  document.title = t;
  const set = (sel, attr, val) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  };
  set('meta[name="description"]', 'content', d);
  set('meta[property="og:title"]', 'content', t);
  set('meta[property="og:description"]', 'content', d);
  set('meta[property="og:url"]', 'content', u);
  set('meta[property="og:image"]', 'content', img);
  set('meta[name="twitter:title"]', 'content', t);
  set('meta[name="twitter:description"]', 'content', d);
  set('meta[name="twitter:image"]', 'content', img);
  set('link[rel="canonical"]', 'href', u);
};

// ── Toast Context ─────────────────────────────────────────────────
export const ToastContext = createContext(null);

const TOAST_DURATION = 3500;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  
  const addToast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION);
  }, []);
  
  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };
  
  const typeStyles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  };
  const typeIcons = { success: '✓', error: '✕', info: 'ℹ' };
  
  return html`
    <${ToastContext.Provider} value=${toast}>
      ${children}
      <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style="max-width:340px">
        ${toasts.map(t => html`
          <div key=${t.id}
            class=${'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-lg shadow-2xl animate-fade-up text-sm font-semibold ' + typeStyles[t.type]}
          >
            <span class="text-base flex-shrink-0">${typeIcons[t.type]}</span>
            <span>${t.message}</span>
          </div>
        `)}
      </div>
    </${ToastContext.Provider}>
  `;
};

export const useToast = () => useContext(ToastContext);

// ── Error Boundary ────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props);
    this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Spitfact error:', error, info); }
  render() {
    if (this.state.error) {
      return html`
        <div class="min-h-screen bg-bg flex items-center justify-center p-6">
          <div class="text-center max-w-sm">
            <div class="text-5xl mb-4">💥</div>
            <h2 class="text-xl font-black text-slate-100 mb-2">Something went wrong</h2>
            <p class="text-sm text-slate-500 mb-6 leading-relaxed">
              ${this.state.error.message}
            </p>
            <button
              onClick=${() => { this.setState({ error: null }); window.location.hash = '/'; }}
              class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-colors"
            >← Back to home</button>
          </div>
        </div>
      `;
    }
    return this.props.children;
  }
}

// ── Route wrappers that inject params ────────────────────────────
const QuestionRoute = ({ user }) => {
  const { id } = useParams();
  return html`<${QuestionPage} id=${id} user=${user} />`;
};

// ── 404 page ──────────────────────────────────────────────────────
const NotFoundPage = () => html`
  <div class="min-h-screen bg-bg flex items-center justify-center p-6">
    <div class="text-center">
      <div class="text-6xl mb-4">🌍</div>
      <h1 class="text-2xl font-black text-slate-100 mb-2">Page not found</h1>
      <p class="text-slate-500 text-sm mb-6">This corner of the world doesn't exist.</p>
      <a href="#/" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm">
        ← Back home
      </a>
    </div>
  </div>
`;

// ── App root ──────────────────────────────────────────────────────
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ── Auth state ─────────────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });
    
    // Listen for auth changes
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const loadProfile = async (authUser) => {
    const { data: profile } = await db
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    
    setUser(profile ?
      { ...authUser, ...profile } :
      { ...authUser }
    );
    setLoading(false);
  };
  
  const handleSignOut = async () => {
    await db.auth.signOut();
    setUser(null);
  };
  
  const handleProfileUpdate = (updated) => setUser(updated);
  
  if (loading) {
    return html`
      <div class="min-h-screen bg-bg flex items-center justify-center">
        <div style="width:32px;height:32px;border:3px solid #1a2540;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite"></div>
      </div>
    `;
  }
  
  return html`
    <${HashRouter}>
      <${ToastProvider}>
        <${ErrorBoundary}>
          <div class="min-h-screen bg-bg text-slate-100 font-sans">
            <${NavBar} user=${user} />

            <main>
              <${Routes}>
                <${Route} path="/"        element=${html`<${Home} user=${user} />`} />
                <${Route} path="/feed"    element=${html`<${FeedPage} user=${user} />`} />
                <${Route} path="/post"    element=${html`<${PostPage} user=${user} />`} />
                <${Route} path="/q/:id"   element=${html`<${QuestionRoute} user=${user} />`} />
                <${Route} path="/auth"    element=${user
                  ? html`<${Navigate} to="/" replace />`
                  : html`<${AuthPage} onSignIn=${loadProfile} />`}
                />
                <${Route} path="/profile" element=${user
                  ? html`<${ProfilePage} user=${user} onSignOut=${handleSignOut} onProfileUpdate=${handleProfileUpdate} />`
                  : html`<${Navigate} to="/auth" replace />`}
                />
                <${Route} path="*" element=${html`<${NotFoundPage} />`} />
              </${Routes}>
            </main>

            <${BottomNav} user=${user} />
          </div>
        </${ErrorBoundary}>
      </${ToastProvider}>
    </${HashRouter}>
  `;
};

// ── Mount ─────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App} />`);