import React, { useState, useEffect } from 'react';
import { db, AGE_RANGES, GENDERS } from '../lib/supabase';
import { navigate } from '../lib/router';

interface Props {
  user: any;
  onSignOut: () => void;
  onProfileUpdate: (user: any) => void;
}

export const ProfilePage: React.FC<Props> = ({ user, onSignOut, onProfileUpdate }) => {
  const [stats, setStats] = useState({ votes: 0, questions: 0 });
  const [editing, setEditing] = useState(false);
  const [ageRange, setAgeRange] = useState(user.age_range || '');
  const [gender, setGender] = useState(user.gender || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      db.from('votes').select('id', { count: 'exact' }).eq('user_id', user.id),
      db.from('questions').select('id', { count: 'exact' }).eq('created_by', user.id),
    ]).then(([{ count: votes }, { count: questions }]) => {
      setStats({ votes: votes || 0, questions: questions || 0 });
    });
  }, [user.id]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await db.from('profiles')
      .update({ age_range: ageRange || null, gender: gender || null })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setMessage('Save failed');
      return;
    }
    setEditing(false);
    setMessage('Profile updated!');
    setTimeout(() => setMessage(''), 3000);
    onProfileUpdate({ ...user, age_range: ageRange, gender });
  };

  const signOut = async () => {
    await db.auth.signOut();
    onSignOut();
    navigate('/');
  };

  const initial = (user.username || user.email || '?')[0].toUpperCase();

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center text-2xl font-black text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{user.username || 'Anonymous'}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
          {(user.age_range || user.gender) && (
            <p className="text-xs text-slate-600 mt-1">
              {[user.age_range, user.gender].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface border border-border1 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-indigo-400">{stats.votes}</div>
          <div className="text-xs text-slate-500">Votes cast</div>
        </div>
        <div className="bg-surface border border-border1 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-cyan-400">{stats.questions}</div>
          <div className="text-xs text-slate-500">Questions</div>
        </div>
      </div>

      {/* Demographics */}
      <div className="bg-surface border border-border1 rounded-xl p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-white">Demographics</h3>
            <p className="text-xs text-slate-500">Used for breakdowns on results</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs font-semibold text-indigo-400">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full bg-subtle border border-border2 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">Age range (optional)</option>
              {AGE_RANGES.map(age => <option key={age} value={age}>{age}</option>)}
            </select>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-subtle border border-border2 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">Gender (optional)</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-indigo-500 text-white font-semibold py-2 rounded-xl">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            {!user.age_range && !user.gender ? (
              <p className="text-center py-2">No demographic data</p>
            ) : (
              <p>{[user.age_range, user.gender].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className="text-center text-sm text-green-400 mb-3">{message}</div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full border border-red-500/30 text-red-400 font-semibold py-3 rounded-xl hover:bg-red-500/10 transition">
        Sign out
      </button>
    </div>
  );
};
