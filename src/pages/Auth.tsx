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

  const inputStyle: React.CSSProperties = {
    width: '100%', marginBottom: 12,
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="animate-fade-in">

        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="logo" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>
            Spitfact
          </div>
          <h1 className="font-heading" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            {tab === 'signin' ? 'Welcome back' : 'Join Spitfact'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A9BB8' }}>
            Vote, predict, and see how the world thinks.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(11,30,61,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12, padding: 4, marginBottom: 20,
        }}>
          {(['signin', 'signup'] as const).map(t => (
            <button key={t} onClick={() => reset(t)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease',
              background: tab === t
                ? 'linear-gradient(145deg, #E8C84A, #D4AF37)'
                : 'transparent',
              color: tab === t ? '#0B1E3D' : '#536280',
              boxShadow: tab === t ? '0 2px 8px rgba(212,175,55,0.3)' : 'none',
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
              marginBottom: 16, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: 13, fontFamily: 'Inter, sans-serif',
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#34d399', fontSize: 13, fontFamily: 'Inter, sans-serif',
            }}>
              {success}
            </div>
          )}

          {/* Username (signup only) */}
          {tab === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="input"
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            style={inputStyle}
            onKeyDown={e => { if (e.key === 'Enter' && tab === 'signin') signIn(); }}
          />

          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            style={{ ...inputStyle, marginBottom: tab === 'signup' ? 16 : 20 }}
            onKeyDown={e => { if (e.key === 'Enter' && tab === 'signin') signIn(); }}
          />

          {/* Signup extras */}
          {tab === 'signup' && (
            <>
              <div style={{
                fontSize: 11, color: '#536280', marginBottom: 10,
                fontFamily: 'Inter, sans-serif',
              }}>
                Optional — add age &amp; gender to unlock demographic breakdowns
              </div>

              <select value={ageRange} onChange={e => setAgeRange(e.target.value)}
                className="input" style={inputStyle}>
                <option value="">Age range (optional)</option>
                {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select value={gender} onChange={e => setGender(e.target.value)}
                className="input" style={{ ...inputStyle, marginBottom: 16 }}>
                <option value="">Gender (optional)</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              {/* Client toggle */}
              <div
                onClick={() => setIsClient(!isClient)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  marginBottom: 20,
                  background: isClient ? 'rgba(212,175,55,0.06)' : 'rgba(11,30,61,0.5)',
                  border: `1px solid ${isClient ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.1)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: isClient
                    ? 'linear-gradient(145deg, #E8C84A, #D4AF37)'
                    : 'transparent',
                  border: isClient
                    ? 'none'
                    : '2px solid rgba(212,175,55,0.3)',
                  color: '#0B1E3D',
                  transition: 'all 0.2s ease',
                }}>
                  {isClient && '✓'}
                </div>
                <div>
                  <div className="font-heading" style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5', marginBottom: 3 }}>
                    I'm a researcher / business
                  </div>
                  <div style={{ fontSize: 12, color: '#8A9BB8' }}>
                    Unlock the client dashboard with full analytics &amp; CSV exports
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            className="btn btn-gold btn-lg"
            onClick={tab === 'signin' ? signIn : signUp}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading
              ? 'Loading…'
              : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="#/" style={{
            fontSize: 12, color: '#536280', textDecoration: 'none',
            fontFamily: 'Inter, sans-serif',
          }}>
            ← Continue without an account
          </a>
        </div>

      </div>
    </div>
  );
};
