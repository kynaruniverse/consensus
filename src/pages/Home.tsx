import React, { useState, useEffect } from 'react';
import { db, COLORS, CATEGORIES, getFlag } from '../lib/supabase';

export const HomePage = () => {
  const [stats, setStats] = useState({ questions: 0, votes: 0, countries: 0 });
  const [featured, setFeatured] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.from('questions').select('id', { count: 'exact', head: true }),
      db.from('votes').select('id', { count: 'exact', head: true }),
      db.from('votes').select('country_code').neq('country_code', 'XX').neq('country_code', null),
      db.from('questions').select('*').order('created_at', { ascending: false }).limit(10),
    ]).then(([{ count: qCount }, { count: vCount }, { data: cData }, { data: questions }]) => {
      const countries = new Set((cData || []).map(v => v.country_code)).size;
      setStats({ questions: qCount || 0, votes: vCount || 0, countries });
      setFeatured(questions?.[0] || null);
      setTrending(questions?.slice(1, 5) || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8 pb-20">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2">
          <span className="text-indigo-400">The World's Opinion,</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Live.
          </span>
        </h1>
        <p className="text-slate-500">Vote on anything. See real-time results from around the planet.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="bg-surface border border-border1 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-indigo-400">{stats.questions}</div>
          <div className="text-xs text-slate-500">Questions</div>
        </div>
        <div className="bg-surface border border-border1 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-cyan-400">{stats.votes}</div>
          <div className="text-xs text-slate-500">Votes</div>
        </div>
        <div className="bg-surface border border-border1 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-pink-400">{stats.countries}</div>
          <div className="text-xs text-slate-500">Countries</div>
        </div>
      </div>

      {/* Featured */}
      {featured && (
        <a href={`#/q/${featured.id}`} className="block g-border-hot rounded-2xl p-6 mb-8 no-underline">
          <div className="flex items-center gap-2 mb-3">
            <span className="live-dot-cyan"></span>
            <span className="text-xs text-cyan-400 font-semibold">Hottest Question</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-4">{featured.question_text}</h2>
          <div className="flex gap-2 mb-4">
            {featured.options.slice(0, 2).map((opt: string, i: number) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full border" 
                style={{ borderColor: COLORS[i % COLORS.length] + '40', color: COLORS[i % COLORS.length] }}>
                {opt}
              </span>
            ))}
          </div>
          <span className="text-indigo-400 text-sm font-semibold">Vote now →</span>
        </a>
      )}

      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Browse by Category</h3>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <a key={cat.id} href={`#/feed?cat=${cat.id}`}
              className="p-4 rounded-xl border no-underline"
              style={{ borderColor: cat.color + '40', background: cat.color + '0d' }}>
              <div className="text-xl mb-1">{cat.label.split(' ')[0]}</div>
              <div className="text-sm font-semibold text-white">{cat.label.split(' ').slice(1).join(' ')}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
