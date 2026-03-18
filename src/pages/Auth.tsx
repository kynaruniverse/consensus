import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { db, AGE_RANGES, GENDERS } from '../lib/supabase';
import { navigate } from '../lib/router';

export const AuthPage = () => {
  const [tab, setTab]           = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender]     = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const reset = (t: 'signin' | 'signup') => {
    setTab(t); setError(''); setSuccess('');
  };

  const signIn = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError('');
    const { error: err } = await db.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); toast.error(err.message); return; }
    navigate('/');
  };

  const signUp = async () => {
    if (!email || !password || !username) {
      setError('Email, password and username are required.'); return;
    }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    const { data, error: err } = await db.auth.signUp({ email, password });
    if (err) { setLoading(false); setError(err.message); return; }
    if (data.user) {
      await db.from('profiles').insert({
        id: data.user.id, username,
        age_range: ageRange || null,
        gender:    gender   || null,
        role: isClient ? 'client' : 'user',
      });
    }
    setLoading(false);
    if (data.session) { navigate('/'); }
    else { setSuccess('Check your email to confirm your account.'); setTab('signin'); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--bg)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--acid-dim) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--hot-dim) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }} className="animate-fade-in">

        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="logo" style={{ display: 'block', marginBottom: 10 }}>
            Spit<span>fact</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 24,
            letterSpacing: '0.02em', marginBottom: 6,
          }}>
            {tab === 'signin' ? 'WELCOME BACK' : 'JOIN SPITFACT'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            Vote, predict, and see how the world thinks.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 4, marginBottom: 20,
        }}>
          {(['signin', 'signup'] as const).map(t => (
            <button key={t} onClick={() => reset(t)} style={{
              flex: 1, padding: '10px 0',
              borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              transition: 'all 0.2s ease',
              background: tab === t ? 'var(--acid)' : 'transparent',
              color: tab === t ? '#0a0a0f' : 'var(--muted)',
              boxShadow: tab === t ? '0 2px 12px var(--acid-glow)' : 'none',
            }}>
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 24 }}>

          {/* Error / success banners */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--hot-dim)', border: '1px solid var(--hot-mid)',
              color: 'var(--hot)', fontSize: 13, fontFamily: 'var(--font-body)',
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#34d399', fontSize: 13, fontFamily: 'var(--font-body)',
            }}>
              {success}
            </div>
          )}

          {tab === 'signup' && (
            <input
              type="text" placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="input" style={{ marginBottom: 12 }}
            />
          )}

          <input
            type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)}
            className="input" style={{ marginBottom: 12 }}
            onKeyDown={e => { if (e.key === 'Enter' && tab === 'signin') signIn(); }}
          />

          <input
            type="password" placeholder="Password (min 6 chars)"
            value={password} onChange={e => setPassword(e.target.value)}
            className="input" style={{ marginBottom: tab === 'signup' ? 16 : 20 }}
            onKeyDown={e => { if (e.key === 'Enter' && tab === 'signin') signIn(); }}
          />

          {tab === 'signup' && (
            <>
              <div style={{
                fontSize: 11, color: 'var(--muted)', marginBottom: 10,
                fontFamily: 'var(--font-mono)',
              }}>
                OPTIONAL — adds demographic breakdowns to your results
              </div>

              <select value={ageRange} onChange={e => setAgeRange(e.target.value)}
                className="input" style={{ marginBottom: 10 }}>
                <option value="">Age range (optional)</option>
                {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select value={gender} onChange={e => setGender(e.target.value)}
                className="input" style={{ marginBottom: 16 }}>
                <option value="">Gender (optional)</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              {/* Business toggle */}
              <div
                onClick={() => setIsClient(!isClient)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', marginBottom: 20,
                  background: isClient ? 'var(--acid-dim)' : 'var(--surface2)',
                  border: `1px solid ${isClient ? 'var(--acid-mid)' : 'var(--border)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 'var(--radius-sm)',
                  flexShrink: 0, marginTop: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: isClient ? 'var(--acid)' : 'transparent',
                  border: isClient ? 'none' : '2px solid var(--border-bright)',
                  color: '#0a0a0f', transition: 'all 0.2s ease',
                }}>
                  {isClient && '✓'}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                    color: 'var(--text)', marginBottom: 3,
                  }}>
                    I'm a researcher / business
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Unlock the client dashboard with full analytics &amp; CSV exports
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            className="btn btn-gold btn-lg"
            onClick={tab === 'signin' ? signIn : signUp}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
          >
            {loading
              ? 'Loading…'
              : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="#/" style={{
            fontSize: 12, color: 'var(--muted)', textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
          }}>
            ← Continue without an account
          </a>
        </div>

      </div>
    </div>
  );
};
