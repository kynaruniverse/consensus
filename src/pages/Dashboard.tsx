import React, { useState, useEffect } from 'react';
import { db, COLORS, getFlag } from '../lib/supabase';
import type { Question, Vote } from '../types';

interface Props {
  user: any;
}

export const DashboardPage: React.FC<Props> = ({ user }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [countryFilter, setCountryFilter] = useState('');

  useEffect(() => {
    db.from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setQuestions(data || []);
        setLoading(false);
      });
  }, []);

  const loadQuestionDetails = async (question: Question) => {
    setSelectedQuestion(question);
    let query = db.from('votes').select('*').eq('question_id', question.id);
    
    if (dateRange.from) {
      query = query.gte('created_at', dateRange.from);
    }
    if (dateRange.to) {
      query = query.lte('created_at', dateRange.to + 'T23:59:59');
    }
    if (countryFilter) {
      query = query.eq('country_code', countryFilter);
    }
    
    const { data } = await query;
    setVotes(data || []);
  };

  const exportCSV = () => {
    if (!selectedQuestion) return;
    
    const headers = ['Option', 'Country', 'Age', 'Gender', 'Date'];
    const rows = votes.map(v => [
      selectedQuestion.options[v.option_index],
      v.country_code || 'XX',
      v.age_range || '',
      v.gender || '',
      new Date(v.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `spitfact-${selectedQuestion.id.slice(0,8)}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-20">
      <h1 className="text-2xl font-black text-white mb-2">Client Dashboard</h1>
      <p className="text-slate-500 text-sm mb-6">Real-time opinion data and analytics</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question list */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border1 rounded-xl p-4">
            <h2 className="font-semibold text-white mb-3">Your Questions</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {questions.map(q => (
                <button
                  key={q.id}
                  onClick={() => loadQuestionDetails(q)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedQuestion?.id === q.id
                      ? 'bg-indigo-500/20 border border-indigo-500/30'
                      : 'hover:bg-subtle'
                  }`}>
                  <p className="text-sm font-medium text-white line-clamp-2">{q.question_text}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(q.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="lg:col-span-2">
          {selectedQuestion ? (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-surface border border-border1 rounded-xl p-4">
                <h2 className="font-semibold text-white mb-3">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="bg-subtle border border-border2 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="bg-subtle border border-border2 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Country (e.g. US)"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value.toUpperCase())}
                    className="bg-subtle border border-border2 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => loadQuestionDetails(selectedQuestion)}
                  className="mt-3 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg">
                  Apply Filters
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-surface border border-border1 rounded-xl p-4">
                  <div className="text-2xl font-black text-indigo-400">{votes.length}</div>
                  <div className="text-xs text-slate-500">Total Votes</div>
                </div>
                <div className="bg-surface border border-border1 rounded-xl p-4">
                  <div className="text-2xl font-black text-cyan-400">
                    {new Set(votes.map(v => v.country_code)).size}
                  </div>
                  <div className="text-xs text-slate-500">Countries</div>
                </div>
                <div className="bg-surface border border-border1 rounded-xl p-4">
                  <div className="text-2xl font-black text-pink-400">
                    {votes.filter(v => v.age_range).length}
                  </div>
                  <div className="text-xs text-slate-500">With Demographics</div>
                </div>
              </div>

              {/* Results breakdown */}
              <div className="bg-surface border border-border1 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-white">Results</h2>
                  <button
                    onClick={exportCSV}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg">
                    Export CSV
                  </button>
                </div>

                {selectedQuestion.options.map((opt, i) => {
                  const count = votes.filter(v => v.option_index === i).length;
                  const pct = votes.length > 0 ? Math.round((count / votes.length) * 100) : 0;
                  return (
                    <div key={i} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{opt}</span>
                        <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: pct + '%',
                            background: COLORS[i % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age breakdown */}
                <div className="bg-surface border border-border1 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">By Age</h3>
                  {Object.entries(
                    votes.filter(v => v.age_range).reduce((acc: Record<string, number>, v) => {
                      acc[v.age_range!] = (acc[v.age_range!] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([age, count]) => {
                    const pct = Math.round((count / votes.length) * 100);
                    return (
                      <div key={age} className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-400 w-16">{age}</span>
                        <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: pct + '%' }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Gender breakdown */}
                <div className="bg-surface border border-border1 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">By Gender</h3>
                  {Object.entries(
                    votes.filter(v => v.gender).reduce((acc: Record<string, number>, v) => {
                      acc[v.gender!] = (acc[v.gender!] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([gender, count]) => {
                    const pct = Math.round((count / votes.length) * 100);
                    return (
                      <div key={gender} className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-400 w-20">{gender}</span>
                        <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: pct + '%' }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border1 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-500">Select a question to view analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
