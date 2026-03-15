// js/auth.js
// ─────────────────────────────────────────────────────────────────
// Auth (sign in / sign up) + Profile page.
// Converted to htm syntax. Errors use toast, not alert/inline msg.
// ─────────────────────────────────────────────────────────────────
import { db, AGE_RANGES, GENDERS } from './db.js';
import { useToast }                 from './app.js';
const { useState, useEffect }       = React;
const { useNavigate }               = ReactRouterDOM;

// ── AuthPage ──────────────────────────────────────────────────────
export const AuthPage = ({ onSignIn }) => {
  const [tab,      setTab]      = useState('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender,   setGender]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const toast    = useToast();
  const navigate = useNavigate();

  const switchTab = (t) => {
    setTab(t);
    setEmail(''); setPassword(''); setUsername('');
    setAgeRange(''); setGender('');
  };

  const signIn = async () => {
    if (!email || !password) { toast.error('Please fill in all fields.'); return; }
    setLoading(true);
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    onSignIn(data.user);
    navigate('/');
  };

  const signUp = async () => {
    if (!email || !password || !username) {
      toast.error('Please fill in email, password and username.'); return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.'); return;
    }
    setLoading(true);

    // Check username uniqueness
    const { data: existing } = await db.from('profiles')
      .select('id').eq('username', username).maybeSingle();
    if (existing) { setLoading(false); toast.error('Username already taken.'); return; }

    const { data, error } = await db.auth.signUp({ email, password });
    if (error) { setLoading(false); toast.error(error.message); return; }

    // Create profile
    if (data.user) {
      await db.from('profiles').insert({
        id:        data.user.id,
        username,
        age_range: ageRange || null,
        gender:    gender   || null,
      });
      onSignIn(data.user);
      navigate('/');
    } else {
      setLoading(false);
      toast.success('Check your email to confirm your account!');
    }
  };

  const inputClass = 'w-full bg-subtle border border-border2 text-slate-100 rounded-[12px] px-3.5 py-3 text-[15px] outline-none transition-all focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 placeholder:text-slate-600';
  const selectClass = inputClass + ' appearance-none cursor-pointer';

  return html`
    <div class="max-w-[440px] mx-auto px-4 pt-[90px] pb-20 animate-fade-up">

      <!-- Logo + heading -->
      <div class="text-center mb-8">
        <div class="text-4xl mb-3">🌍</div>
        <h1 class="text-[26px] font-black tracking-tight text-slate-100 mb-1.5">
          ${tab === 'signin' ? 'Welcome back' : 'Join Spitfact'}
        </h1>
        <p class="text-slate-500 text-sm">
          ${tab === 'signin'
            ? 'Sign in to track your questions and unlock demographic results.'
            : 'Create an account to post questions and see how the world votes.'}
        </p>
      </div>

      <!-- Tab bar -->
      <div class="flex bg-surface border border-border1 rounded-[12px] p-1 gap-1 mb-6">
        ${['signin', 'signup'].map(t => html`
          <button key=${t}
            onClick=${() => switchTab(t)}
            class=${'flex-1 py-2.5 rounded-[9px] text-sm font-bold transition-all cursor-pointer border-none ' + (tab === t ? 'text-white shadow-md' : 'bg-transparent text-slate-500 hover:text-slate-400')}
            style=${tab === t ? 'background:linear-gradient(135deg,#6366f1,#4f46e5)' : ''}>
            ${t === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        `)}
      </div>

      <!-- Form -->
      <div class="g-border rounded-[20px] p-6 flex flex-col gap-3">

        ${tab === 'signup' && html`
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Username</label>
            <input type="text" class=${inputClass}
              placeholder="your_handle (public)"
              value=${username}
              onInput=${ev => setUsername(ev.target.value.replace(/\s/g, '').toLowerCase())}
            />
          </div>
        `}

        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Email</label>
          <input type="email" class=${inputClass}
            placeholder="you@example.com"
            value=${email}
            onInput=${ev => setEmail(ev.target.value)}
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Password</label>
          <input type="password" class=${inputClass}
            placeholder=${tab === 'signup' ? 'Min 6 characters' : '••••••••'}
            value=${password}
            onInput=${ev => setPassword(ev.target.value)}
            onKeyDown=${ev => ev.key === 'Enter' && (tab === 'signin' ? signIn() : signUp())}
          />
        </div>

        ${tab === 'signup' && html`
          <hr class="border-border1 my-1" />
          <p class="text-[13px] text-slate-500 leading-relaxed">
            🎯 Optional: Add age & gender to unlock demographic breakdowns on results.
          </p>
          <select class=${selectClass} value=${ageRange} onChange=${ev => setAgeRange(ev.target.value)}>
            <option value="">Age range (optional)</option>
            ${AGE_RANGES.map(a => html`<option key=${a} value=${a}>${a}</option>`)}
          </select>
          <select class=${selectClass} value=${gender} onChange=${ev => setGender(ev.target.value)}>
            <option value="">Gender (optional)</option>
            ${GENDERS.map(g => html`<option key=${g} value=${g}>${g}</option>`)}
          </select>
        `}

        <button
          class="w-full py-4 rounded-[14px] text-white font-bold text-[16px] transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style="background:linear-gradient(135deg,#6366f1,#4f46e5);box-shadow:0 4px 20px rgba(99,102,241,0.35)"
          disabled=${loading}
          onClick=${tab === 'signin' ? signIn : signUp}
        >
          ${loading ? '⏳ Please wait...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <p class="text-center text-[13px] text-slate-500">
          ${tab === 'signin'
            ? html`Don't have an account?${' '}<button onClick=${() => switchTab('signup')} class="text-indigo-400 font-semibold bg-transparent border-none cursor-pointer hover:text-indigo-300">Sign up free</button>`
            : html`Already have an account?${' '}<button onClick=${() => switchTab('signin')} class="text-indigo-400 font-semibold bg-transparent border-none cursor-pointer hover:text-indigo-300">Sign in</button>`
          }
        </p>
      </div>

      <div class="text-center mt-5">
        <a href="#/" class="text-[13px] text-slate-600 hover:text-slate-400 transition-colors">← Continue without account</a>
      </div>
    </div>
  `;
};

// ── ProfilePage ───────────────────────────────────────────────────
export const ProfilePage = ({ user, onSignOut, onProfileUpdate }) => {
  const [stats,    setStats]    = useState(null);
  const [editing,  setEditing]  = useState(false);
  const [ageRange, setAgeRange] = useState(user.age_range || '');
  const [gender,   setGender]   = useState(user.gender   || '');
  const [saving,   setSaving]   = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      db.from('votes').select('id', { count: 'exact' }).eq('user_id', user.id),
      db.from('questions').select('id', { count: 'exact' }).eq('created_by', user.id),
    ]).then(([{ count: votes }, { count: questions }]) => {
      setStats({ votes: votes || 0, questions: questions || 0 });
    });
  }, [user.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await db.from('profiles')
      .update({ age_range: ageRange || null, gender: gender || null })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    setEditing(false);
    toast.success('Profile updated!');
    onProfileUpdate({ ...user, age_range: ageRange || null, gender: gender || null });
  };

  const initial = (user.username || user.email || '?')[0].toUpperCase();
  const inputClass = 'w-full bg-subtle border border-border2 text-slate-100 rounded-[12px] px-3.5 py-3 text-[14px] outline-none transition-all focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 appearance-none placeholder:text-slate-600';

  return html`
    <div class="max-w-[640px] mx-auto px-4 pt-[90px] pb-[100px] animate-fade-up">

      <!-- Avatar + name -->
      <div class="flex items-center gap-4 mb-7">
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-[22px] font-black text-white flex-shrink-0"
          style="background:linear-gradient(135deg,#6366f1,#a78bfa)">
          ${initial}
        </div>
        <div>
          <h1 class="text-[22px] font-black text-slate-100">${user.username || 'Anonymous'}</h1>
          <p class="text-slate-500 text-sm mt-0.5">${user.email}</p>
          ${(user.age_range || user.gender) && html`
            <p class="text-slate-500 text-[13px] mt-0.5">
              ${[user.age_range, user.gender].filter(Boolean).join(' · ')}
            </p>
          `}
        </div>
      </div>

      <!-- Stats -->
      ${stats && html`
        <div class="flex gap-2.5 mb-7">
          ${[
            { value: stats.votes,     label: 'Votes cast' },
            { value: stats.questions, label: 'Questions posted' },
          ].map(s => html`
            <div key=${s.label} class="flex-1 bg-surface border border-border1 rounded-[14px] p-4 text-center">
              <div class="text-[28px] font-black text-slate-100 leading-none">${s.value}</div>
              <div class="text-[11px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">${s.label}</div>
            </div>
          `)}
        </div>
      `}

      <!-- Demographics card -->
      <div class="g-border rounded-[18px] p-5 mb-3">
        <div class=${'flex justify-between items-center ' + (editing ? 'mb-4' : '')}>
          <div>
            <div class="font-bold text-[15px] text-slate-100 mb-0.5">Demographics</div>
            <div class="text-[13px] text-slate-500">Used for breakdowns. Never shown publicly.</div>
          </div>
          <button
            onClick=${() => setEditing(!editing)}
            class="px-3.5 py-1.5 border border-border2 rounded-[10px] text-indigo-400 text-[13px] font-semibold bg-transparent cursor-pointer hover:border-indigo-400/50 transition-colors">
            ${editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        ${editing && html`
          <div class="flex flex-col gap-2.5">
            <select class=${inputClass} value=${ageRange} onChange=${ev => setAgeRange(ev.target.value)}>
              <option value="">Age range (optional)</option>
              ${AGE_RANGES.map(a => html`<option key=${a} value=${a}>${a}</option>`)}
            </select>
            <select class=${inputClass} value=${gender} onChange=${ev => setGender(ev.target.value)}>
              <option value="">Gender (optional)</option>
              ${GENDERS.map(g => html`<option key=${g} value=${g}>${g}</option>`)}
            </select>
            <button
              class="w-full py-3.5 rounded-[14px] text-white font-bold text-[15px] transition-all mt-1 disabled:opacity-60"
              style="background:linear-gradient(135deg,#6366f1,#4f46e5)"
              disabled=${saving}
              onClick=${save}>
              ${saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        `}
      </div>

      <!-- Sign out -->
      <button
        class="w-full py-3.5 rounded-[14px] border border-red-500/30 text-red-400 font-semibold text-[14px] bg-transparent cursor-pointer hover:bg-red-500/8 transition-colors mt-2"
        onClick=${onSignOut}>
        → Sign out
      </button>
    </div>
  `;
};
