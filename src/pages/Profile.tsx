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
    if (error) {
      toast.error('Save failed — please try again.');
      return;
    }
    setEditing(false);
    toast.success('Profile updated!');
    onProfileUpdate({ ...user, age_range: ageRange, gender });
  };

  const signOut = async () => {
    await db.auth.signOut();
    onSignOut();
    navigate('/');
  };

  const initial = (user.username || '?')[0].toUpperCase();
  const hasDemographics = !!(user.age_range || user.gender);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 20px 40px' }}>

      {/* ── Avatar + name ── */}
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div className="avatar avatar-xl">{initial}</div>
        <div>
          <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {user.username || 'Anonymous'}
          </h1>
          {hasDemographics && (
            <p style={{ fontSize: 13, color: '#8A9BB8', margin: 0 }}>
              {[user.age_range, user.gender].filter(Boolean).join(' · ')}
            </p>
          )}
          <div style={{ marginTop: 6 }}>
            {user.role === 'client' ? (
              <span className="badge badge-gold">⭐ Pro Account</span>
            ) : (
              <span className="badge badge-navy">Free Account</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="data-value data-value-lg" style={{ color: '#D4AF37', display: 'block', marginBottom: 4 }}>
            {stats.votes}
          </div>
          <div className="section-label">Votes cast</div>
        </div>
        <div className="stat-card">
          <div className="data-value data-value-lg" style={{ color: '#C0C0C0', display: 'block', marginBottom: 4 }}>
            {stats.questions}
          </div>
          <div className="section-label">Questions asked</div>
        </div>
      </div>

      {/* ── Demographics card ── */}
      <div className="card" style={{ padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 className="font-heading" style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>
              Demographics
            </h3>
            <p style={{ fontSize: 12, color: '#8A9BB8', margin: 0 }}>
              Used for breakdowns on poll results
            </p>
          </div>
          <button
            onClick={() => { setEditing(!editing); setMessage(''); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: editing ? '#536280' : '#D4AF37',
              fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600,
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
          <div style={{ fontSize: 14, color: hasDemographics ? '#C8D4E8' : '#536280' }}>
            {hasDemographics
              ? [user.age_range, user.gender].filter(Boolean).join(' · ')
              : 'No demographic data set yet.'}
          </div>
        )}
      </div>

      {/* ── Client dashboard link ── */}
      {user.role === 'client' && (
        <button
          className="btn btn-ghost btn-md"
          onClick={() => navigate('/dashboard')}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
        >
          📊 Open Client Dashboard
        </button>
      )}

      {/* ── Sign out ── */}
      <button
        className="btn btn-danger btn-md"
        onClick={signOut}
        style={{ width: '100%', justifyContent: 'center', borderRadius: 12 }}
      >
        Sign out
      </button>
    </div>
  );
};
