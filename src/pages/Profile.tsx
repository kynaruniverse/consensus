import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { db, AGE_RANGES, GENDERS } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { Profile } from '../types';

interface Props {
  user: Profile;
  onSignOut: () => void;
  onProfileUpdate: (u: Profile) => void;
}

export const ProfilePage: React.FC<Props> = ({ user, onSignOut, onProfileUpdate }) => {
  const [stats, setStats]       = useState({ votes: 0, questions: 0 });
  const [editing, setEditing]   = useState(false);
  const [ageRange, setAgeRange] = useState(user.age_range || '');
  const [gender, setGender]     = useState(user.gender    || '');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([
      db.from('votes').select('id',     { count: 'exact' }).eq('user_id',    user.id),
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
    if (error) { toast.error('Save failed — please try again.'); return; }
    setEditing(false);
    toast.success('Profile updated!');
    onProfileUpdate({ ...user, age_range: ageRange, gender });
  };

  const signOut = async () => {
    await db.auth.signOut();
    onSignOut();
    navigate('/');
  };

  const initial         = (user.username || '?')[0].toUpperCase();
  const hasDemographics = !!(user.age_range || user.gender);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 20px 48px' }}>

      {/* Avatar + name */}
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div className="avatar avatar-xl">{initial}</div>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 6vw, 40px)',
            letterSpacing: '0.02em', marginBottom: 4,
          }}>
            {(user.username || 'Anonymous').toUpperCase()}
          </h1>
          {hasDemographics && (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 8px', fontFamily: 'var(--font-mono)' }}>
              {[user.age_range, user.gender].filter(Boolean).join(' · ')}
            </p>
          )}
          <div>
            {user.role === 'client' ? (
              <span className="badge badge-gold">⭐ Pro Account</span>
            ) : (
              <span className="badge badge-navy">Free Account</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="data-value data-value-lg" style={{ color: 'var(--acid)', display: 'block', marginBottom: 6 }}>
            {stats.votes}
          </div>
          <div className="section-label">Votes cast</div>
        </div>
        <div className="stat-card">
          <div className="data-value data-value-lg" style={{ color: 'var(--cool)', display: 'block', marginBottom: 6 }}>
            {stats.questions}
          </div>
          <div className="section-label">Questions asked</div>
        </div>
      </div>

      {/* Demographics */}
      <div className="card" style={{ padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
              color: 'var(--text)', marginBottom: 3,
            }}>
              Demographics
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Used for breakdowns on poll results
            </p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: editing ? 'var(--muted)' : 'var(--acid)',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
            }}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={ageRange} onChange={e => setAgeRange(e.target.value)} className="input">
              <option value="">Age range (optional)</option>
              {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={gender} onChange={e => setGender(e.target.value)} className="input">
              <option value="">Gender (optional)</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button
              className="btn btn-gold btn-md"
              onClick={saveProfile}
              disabled={saving}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : (
          <div style={{
            fontSize: 14, fontFamily: 'var(--font-body)',
            color: hasDemographics ? 'var(--text-2)' : 'var(--muted)',
          }}>
            {hasDemographics
              ? [user.age_range, user.gender].filter(Boolean).join(' · ')
              : 'No demographic data set yet.'}
          </div>
        )}
      </div>

      {/* Client dashboard */}
      {user.role === 'client' && (
        <button
          className="btn btn-ghost btn-md"
          onClick={() => navigate('/dashboard')}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
        >
          📊 Open Client Dashboard
        </button>
      )}

      {/* Sign out */}
      <button
        className="btn btn-danger btn-md"
        onClick={signOut}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Sign out
      </button>
    </div>
  );
};
