import React, { useState } from 'react';
import { db, AGE_RANGES, GENDERS } from '../lib/supabase';
import { navigate } from '../lib/router';

export const AuthPage = () => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const signIn = async () => {
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await db.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate('/');
  };

  const signUp = async () => {
    if (!email || !password || !username) {
      setError('Email, password and username are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: err } = await db.auth.signUp({ email, password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    if (data.user) {
      await db.from('profiles').insert({
        id: data.user.id,
        username,
        age_range: ageRange || null,
        gender: gender || null,
        role: isClient ? 'client' : 'user',
      });
    }

    setLoading(false);
    if (data.session) {
      navigate('/');
    } else {
      setSuccess('Check your email to confirm your account.');
      setTab('signin');
    }
  };

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-20">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🌍</div>
        <h1 className="text-2xl font-black mb-1">Join Consensus</h1>
        <p className="text-slate-500 text-sm">Vote, predict, and see how the world thinks.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border1 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setTab('signin'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'signin' ? 'bg-indigo-500 text-white' : 'text-slate-500'
          }`}>
          Sign In
        </button>
        <button
          onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
            tab === 'signup' ? 'bg-indigo-500 text-white' : 'text-slate-500'
          }`}>
          Sign Up
        </button>
      </div>

      {/* Form */}
      <div className="bg-surface border border-border1 rounded-2xl p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {tab === 'signup' && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            className="w-full bg-subtle border border-border2 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-indigo-500"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-subtle border border-border2 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-indigo-500"
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-subtle border border-border2 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-indigo-500"
        />

        {tab === 'signup' && (
          <>
            <div className="text-xs text-slate-500 mb-3">Optional: Add age & gender for demographic breakdowns</div>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full bg-subtle border border-border2 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-indigo-500">
              <option value="">Age range (optional)</option>
              {AGE_RANGES.map(age => <option key={age} value={age}>{age}</option>)}
            </select>

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-subtle border border-border2 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-indigo-500">
              <option value="">Gender (optional)</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <div
              onClick={() => setIsClient(!isClient)}
              className="mb-4 p-3 border rounded-xl flex items-start gap-3 cursor-pointer"
              style={{ borderColor: isClient ? '#6366f150' : '#243050' }}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs ${
                isClient ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
              }`}>
                {isClient && '✓'}
              </div>
              <div>
                <div className="text-sm font-semibold text-white mb-1">I'm a researcher / business</div>
                <div className="text-xs text-slate-500">Unlock the client dashboard with full data exports</div>
              </div>
            </div>
          </>
        )}

        <button
          onClick={tab === 'signin' ? signIn : signUp}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50">
          {loading ? 'Loading...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </div>

      <div className="text-center mt-4">
        <a href="#/" className="text-xs text-slate-600 hover:text-slate-500">← Continue without account</a>
      </div>
    </div>
  );
};
