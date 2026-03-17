import React, { useState } from 'react';
import { db, COLORS, CATEGORIES } from '../lib/supabase';
import { navigate } from '../lib/router';

interface Props {
  user?: any;
}

export const PostPage: React.FC<Props> = ({ user }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [category, setCategory] = useState('General');
  const [posting, setPosting] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] = useState('');

  const checkModeration = async (text: string) => {
    try {
      const response = await fetch('/.netlify/edge-functions/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type: 'question' })
      });
      const data = await response.json();
      return data.flagged;
    } catch {
      return false; // Fail open if moderation service is down
    }
  };

  const post = async () => {
    const valid = options.filter(o => o.trim() !== '');
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }
    if (valid.length < 2) {
      alert('Add at least 2 options');
      return;
    }

    setModerating(true);
    const flagged = await checkModeration(question);
    setModerating(false);

    if (flagged) {
      setModerationError('Your question was flagged as inappropriate. Please revise.');
      return;
    }

    setPosting(true);
    const payload: any = {
      question_text: question.trim(),
      options: valid,
      category,
    };
    if (user) payload.created_by = user.id;

    const { data, error } = await db.from('questions').insert(payload).select().single();
    setPosting(false);

    if (error) {
      alert('Failed to post: ' + error.message);
      return;
    }
    navigate('/q/' + data.id);
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8 pb-20">
      <h1 className="text-2xl font-black text-white mb-2">Ask the world</h1>
      <p className="text-slate-500 text-sm mb-6">Post your question and watch votes come in live.</p>

      {moderationError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {moderationError}
        </div>
      )}

      <div className="g-border rounded-2xl p-6">
        {/* Question */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
            Your question
          </label>
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setModerationError('');
            }}
            placeholder="e.g. Is a hotdog a sandwich?"
            rows={3}
            className="w-full bg-subtle border border-border2 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
          />
          <div className="text-right text-xs mt-1 text-slate-600">
            {question.length}/200
          </div>
        </div>

        {/* Category */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  category === c.id
                    ? 'text-white'
                    : 'bg-surface border border-border1 text-slate-500'
                }`}
                style={category === c.id ? { background: c.color + '30', borderColor: c.color } : {}}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
            Options (2–4)
          </label>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[i] = e.target.value;
                    setOptions(newOpts);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-subtle border border-border2 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => setOptions(options.filter((_, j) => j !== i))}
                    className="text-slate-600 hover:text-red-400 text-xl">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add option */}
        {options.length < 4 && (
          <button
            onClick={() => setOptions([...options, ''])}
            className="text-indigo-400 text-sm font-semibold mb-5">
            + Add another option
          </button>
        )}

        {/* Submit */}
        <button
          onClick={post}
          disabled={posting || moderating}
          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50">
          {moderating ? 'Checking...' : posting ? 'Posting...' : '🌍 Post to the World'}
        </button>

        {!user && (
          <p className="text-center text-xs text-slate-500 mt-3">
            Posting anonymously. <a href="#/auth" className="text-indigo-400">Sign in</a> to track your questions.
          </p>
        )}
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        All questions are automatically moderated for safety.
      </p>
    </div>
  );
};
