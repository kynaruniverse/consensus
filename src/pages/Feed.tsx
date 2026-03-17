import React, { useState, useEffect } from 'react';
import { db, COLORS, CATEGORIES } from '../lib/supabase';
import type { Question } from '../types';

export const FeedPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      db.from('questions').select('*').order('created_at', { ascending: false }),
      db.from('votes').select('question_id')
    ]).then(([{ data: qs }, { data: vs }]) => {
      setQuestions(qs || []);
      const counts = (vs || []).reduce((acc: Record<string, number>, v) => {
        acc[v.question_id] = (acc[v.question_id] || 0) + 1;
        return acc;
      }, {});
      setVoteCounts(counts);
      setLoading(false);
    });
  }, []);

  const filtered = questions.filter(q => {
    if (activeCat !== 'All' && q.category !== activeCat) return false;
    if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-4 pb-20">
      {/* Search */}
      <div className="sticky top-[58px] bg-bg/90 backdrop-blur-md border-b border-border1 -mx-4 px-4 py-3 mb-4 z-40">
        <input
          type="search"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border1 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 pb-1">
          <button
            onClick={() => setActiveCat('All')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
              activeCat === 'All' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-surface border border-border1 text-slate-500'
            }`}>
            🌐 All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                activeCat === cat.id
                  ? 'text-white'
                  : 'bg-surface border border-border1 text-slate-500'
              }`}
              style={activeCat === cat.id ? { background: cat.color + '30', borderColor: cat.color } : {}}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-500">No questions found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(q => {
            const votes = voteCounts[q.id] || 0;
            const voted = localStorage.getItem('voted_' + q.id) !== null;
            const cat = CATEGORIES.find(c => c.id === q.category);

            return (
              <a
                key={q.id}
                href={`#/q/${q.id}`}
                className="g-border-subtle block rounded-xl p-4 no-underline transition hover:-translate-y-0.5">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <p className="text-base font-semibold text-white flex-1">{q.question_text}</p>
                  {cat && cat.id !== 'General' && (
                    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ border: '1px solid ' + cat.color + '40', color: cat.color }}>
                      {cat.label.split(' ')[1]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {q.options.slice(0, 2).map((opt, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ border: '1px solid ' + COLORS[i % COLORS.length] + '40', color: COLORS[i % COLORS.length] }}>
                        {opt}
                      </span>
                    ))}
                    {q.options.length > 2 && (
                      <span className="text-xs text-slate-600">+{q.options.length - 2}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">{votes} votes</span>
                    {voted && <span className="text-emerald-400 text-xs">✓</span>}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
