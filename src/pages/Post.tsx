import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { db, COLORS, CATEGORIES } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { Profile } from '../types';

interface Props { user?: Profile | null; }

const MAX_CHARS = 200;

export const PostPage: React.FC<Props> = ({ user }) => {
  const [question, setQuestion]               = useState('');
  const [options, setOptions]                 = useState(['', '']);
  const [category, setCategory]               = useState('General');
  const [posting, setPosting]                 = useState(false);
  const [moderating, setModerating]           = useState(false);
  const [error, setError]                     = useState('');

  const checkModeration = async (text: string): Promise<boolean> => {
    try {
      const res  = await fetch('/.netlify/edge-functions/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type: 'question' }),
      });
      const data = await res.json();
      return data.flagged;
    } catch { return false; }
  };

  const post = async () => {
    const valid = options.filter(o => o.trim());
    if (!question.trim())  { setError('Please enter a question.'); return; }
    if (valid.length < 2)  { setError('Add at least 2 options.');  return; }
    if (question.length > MAX_CHARS) { setError(`Question must be under ${MAX_CHARS} characters.`); return; }

    setError('');
    setModerating(true);
    const flagged = await checkModeration(question);
    setModerating(false);

    if (flagged) {
      setError('Your question was flagged as inappropriate. Please revise.');
      return;
    }

    setPosting(true);
    const payload: any = { question_text: question.trim(), options: valid, category };
    if (user) payload.created_by = user.id;

    const { data, error: err } = await db.from('questions').insert(payload).select().single();
    setPosting(false);

    if (err) {
      setError('Failed to post: ' + err.message);
      toast.error('Failed to post question. Please try again.');
      return;
    }
    toast.success('Question posted! Watch the votes come in 🌍');
    navigate('/q/' + data.id);
  };

  const charPct = Math.min((question.length / MAX_CHARS) * 100, 100);
  const charColor = question.length > MAX_CHARS * 0.9 ? '#f87171'
    : question.length > MAX_CHARS * 0.75 ? '#D4AF37'
    : '#536280';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 40px' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 24 }}>
        <h1 className="font-heading" style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          Ask the world
        </h1>
        <p style={{ fontSize: 14, color: '#8A9BB8' }}>
          Post your question and watch votes come in live from around the globe.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 13, fontFamily: 'Inter, sans-serif',
        }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>

        {/* ── Question field ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>YOUR QUESTION</div>
          <textarea
            value={question}
            onChange={e => { setQuestion(e.target.value); setError(''); }}
            placeholder="e.g. Is a hotdog a sandwich?"
            rows={3}
            maxLength={MAX_CHARS + 20}
            className="input"
            style={{ resize: 'none' }}
          />
          {/* Character counter */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 8, marginTop: 6,
          }}>
            <div style={{
              width: 80, height: 4, borderRadius: 999,
              background: 'rgba(11,30,61,0.8)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 999,
                width: charPct + '%',
                background: charColor,
                transition: 'width 0.2s ease, background 0.2s ease',
              }} />
            </div>
            <span style={{ fontSize: 11, color: charColor, fontFamily: 'Roboto Mono, monospace' }}>
              {question.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* ── Category ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>CATEGORY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="cat-chip"
                style={category === c.id ? {
                  background: c.color + '22',
                  borderColor: c.color + '80',
                  color: c.color,
                } : {}}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Options ── */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>OPTIONS (2–4)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Number dot */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
                  background: COLORS[i % COLORS.length] + '20',
                  color: COLORS[i % COLORS.length],
                  border: `1px solid ${COLORS[i % COLORS.length]}40`,
                }}>
                  {i + 1}
                </div>

                <input
                  type="text"
                  value={opt}
                  onChange={e => {
                    const n = [...options]; n[i] = e.target.value; setOptions(n);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="input"
                  style={{ flex: 1, marginBottom: 0 }}
                />

                {options.length > 2 && (
                  <button
                    onClick={() => setOptions(options.filter((_, j) => j !== i))}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#536280', fontSize: 20, lineHeight: 1,
                      padding: '2px 6px', borderRadius: 6,
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#536280')}
                    aria-label="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 4 && (
            <button
              onClick={() => setOptions([...options, ''])}
              style={{
                marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
                color: '#D4AF37', fontSize: 13, fontWeight: 600,
                fontFamily: 'Poppins, sans-serif', padding: '4px 0',
              }}
            >
              + Add another option
            </button>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="divider" />

        {/* ── Submit ── */}
        <button
          className="btn btn-gold btn-lg"
          onClick={post}
          disabled={posting || moderating}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
        >
          {moderating ? '🔍 Checking…'
            : posting  ? '📡 Posting…'
            : '🌍 Post to the World'}
        </button>

        {!user && (
          <p style={{
            textAlign: 'center', fontSize: 12, color: '#536280',
            fontFamily: 'Inter, sans-serif', margin: 0,
          }}>
            Posting anonymously.{' '}
            <a href="#/auth" style={{ color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </a>{' '}
            to track your questions.
          </p>
        )}
      </div>

      <p style={{
        textAlign: 'center', fontSize: 11, color: '#536280',
        marginTop: 12, fontFamily: 'Inter, sans-serif',
      }}>
        All questions are automatically moderated for safety.
      </p>
    </div>
  );
};
