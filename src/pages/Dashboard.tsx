import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { db, COLORS, CATEGORIES, getFlag } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie, Legend,
} from 'recharts';
import type { Question, Vote } from '../types';
import type { Profile } from '../types';

interface Props { user: Profile; }

/* ── Mini bar row ────────────────────────────────────────────── */
const MiniBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
    <span style={{
      fontSize: 12, color: 'var(--muted)', width: 80, flexShrink: 0,
      fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
      overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{label}</span>
    <div className="vote-bar-track" style={{ flex: 1 }}>
      <div className="vote-bar-fill" style={{ width: pct + '%', background: color }} />
    </div>
    <span className="data-value data-value-sm"
      style={{ color: 'var(--muted)', width: 34, textAlign: 'right' }}>{pct}%</span>
  </div>
);

/* ── Mini stat card ──────────────────────────────────────────── */
const MiniStat = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <div className="stat-card" style={{ padding: '16px' }}>
    <div className="data-value data-value-lg" style={{ color, display: 'block', marginBottom: 6 }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
    <div className="section-label">{label}</div>
  </div>
);

/* ── Custom chart tooltip ────────────────────────────────────── */
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border-mid)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      fontFamily: 'var(--font-body)', fontSize: 12,
    }}>
      {label && <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || 'var(--acid)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600 }}>
            {p.value}
          </span>
          {p.name && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>{p.name}</span>}
        </div>
      ))}
    </div>
  );
};

/* ── Empty panel ─────────────────────────────────────────────── */
const EmptyPanel = () => (
  <div className="panel" style={{
    padding: 56, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14,
    minHeight: 320,
  }}>
    <div style={{ fontSize: 40 }}>📊</div>
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 22,
      letterSpacing: '0.02em', color: 'var(--muted)',
    }}>
      SELECT A POLL
    </div>
    <div style={{
      fontSize: 13, color: 'var(--muted-2)',
      textAlign: 'center', maxWidth: 240, lineHeight: 1.6,
    }}>
      Choose a question from the list on the left to view full analytics.
    </div>
  </div>
);

/* ── Main page ───────────────────────────────────────────────── */
export const DashboardPage: React.FC<Props> = ({ user }) => {
  const [questions, setQuestions]         = useState<Question[]>([]);
  const [selected, setSelected]           = useState<Question | null>(null);
  const [votes, setVotes]                 = useState<Vote[]>([]);
  const [loadingQ, setLoadingQ]           = useState(true);
  const [loadingV, setLoadingV]           = useState(false);
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [search, setSearch]               = useState('');

  useEffect(() => {
    db.from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setQuestions(data || []); setLoadingQ(false); });
  }, []);

  const loadVotes = async (q: Question) => {
    setSelected(q); setLoadingV(true);
    let query = db.from('votes').select('*').eq('question_id', q.id);
    if (dateFrom)      query = query.gte('created_at', dateFrom);
    if (dateTo)        query = query.lte('created_at', dateTo + 'T23:59:59');
    if (countryFilter) query = query.eq('country_code', countryFilter.toUpperCase());
    const { data } = await query;
    setVotes(data || []);
    setLoadingV(false);
  };

  const exportCSV = () => {
    if (!selected) return;
    const headers = ['Option', 'Country', 'Age', 'Gender', 'Date'];
    const rows = votes.map(v => [
      selected.options[v.option_index],
      v.country_code || 'XX',
      v.age_range || '',
      v.gender || '',
      new Date(v.created_at).toLocaleDateString(),
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `spitfact-${selected.id.slice(0,8)}.csv`;
    a.click();
    toast.success(`Exported ${votes.length} rows as CSV`);
  };

  /* ── Derived data ──────────────────────────────────────────── */
  const total = votes.length;

  const barData = selected
    ? selected.options.map((opt, i) => ({
        name:  opt.length > 12 ? opt.slice(0,11) + '…' : opt,
        full:  opt,
        votes: votes.filter(v => v.option_index === i).length,
        pct:   total > 0 ? Math.round((votes.filter(v => v.option_index === i).length / total) * 100) : 0,
        color: COLORS[i % COLORS.length],
      }))
    : [];

  const pieData = barData.filter(d => d.votes > 0).map(d => ({
    name: d.full, value: d.votes, color: d.color,
  }));

  const timeData = (() => {
    const map: Record<string, number> = {};
    votes.forEach(v => {
      const day = v.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  })();

  const countryData = Object.entries(
    votes.reduce((acc: Record<string,number>, v) => {
      const c = v.country_code || 'XX'; acc[c] = (acc[c]||0)+1; return acc;
    }, {})
  ).sort((a,b) => b[1]-a[1]).slice(0,6)
    .map(([code, count]) => ({ code, count, pct: Math.round((count/total)*100) }));

  const ageData = Object.entries(
    votes.filter(v => v.age_range).reduce((acc: Record<string,number>, v) => {
      acc[v.age_range!] = (acc[v.age_range!]||0)+1; return acc;
    }, {})
  ).sort((a,b) => b[1]-a[1]).map(([k,n]) => ({ key: k, pct: Math.round((n/total)*100) }));

  const genderData = Object.entries(
    votes.filter(v => v.gender).reduce((acc: Record<string,number>, v) => {
      acc[v.gender!] = (acc[v.gender!]||0)+1; return acc;
    }, {})
  ).sort((a,b) => b[1]-a[1]).map(([k,n]) => ({ key: k, pct: Math.round((n/total)*100) }));

  const filteredQs = questions.filter(q =>
    !search || q.question_text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 48px' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 6vw, 48px)',
              letterSpacing: '0.02em', marginBottom: 6,
            }}>
              DASHBOARD
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>
              Real-time opinion data, analytics and exports
            </p>
          </div>
          <span className="badge badge-gold">⭐ Pro</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── LEFT: question list ──────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Search */}
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="search"
              placeholder="Search polls…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ marginBottom: 0, fontSize: 12, padding: '8px 12px' }}
            />
          </div>

          <div style={{ maxHeight: 560, overflowY: 'auto' }} className="scrollbar-hide">
            {loadingQ ? (
              [0,1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 52, margin: '8px 12px' }} />
              ))
            ) : filteredQs.length === 0 ? (
              <div style={{
                padding: '24px 12px', textAlign: 'center',
                fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
              }}>
                No polls found
              </div>
            ) : filteredQs.map(q => (
              <button
                key={q.id}
                onClick={() => loadVotes(q)}
                style={{
                  display: 'block', width: '100%', padding: '12px 14px',
                  background: selected?.id === q.id ? 'var(--acid-dim)' : 'transparent',
                  borderLeft: `3px solid ${selected?.id === q.id ? 'var(--acid)' : 'transparent'}`,
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (selected?.id !== q.id)
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)';
                }}
                onMouseLeave={e => {
                  if (selected?.id !== q.id)
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <p style={{
                  fontSize: 13, fontWeight: 600,
                  color: selected?.id === q.id ? 'var(--acid)' : 'var(--text-2)',
                  margin: '0 0 4px', fontFamily: 'var(--font-body)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {q.question_text}
                </p>
                <span style={{
                  fontSize: 10, color: 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: analytics ─────────────────────────────── */}
        <div>
          {!selected ? (
            <EmptyPanel />
          ) : loadingV ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Question title + export */}
              <div className="panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
                    flex: 1, lineHeight: 1.4, color: 'var(--text)',
                  }}>
                    {selected.question_text}
                  </h2>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={exportCSV}
                    style={{ flexShrink: 0 }}
                  >
                    ↓ Export CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="card" style={{ padding: '14px 16px' }}>
                <div className="section-label" style={{ marginBottom: 10 }}>FILTERS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 10 }}>
                  <input
                    type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="input" style={{ marginBottom: 0, fontSize: 12 }}
                  />
                  <input
                    type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="input" style={{ marginBottom: 0, fontSize: 12 }}
                  />
                  <input
                    type="text" placeholder="Country code (e.g. US)"
                    value={countryFilter}
                    onChange={e => setCountryFilter(e.target.value.toUpperCase())}
                    className="input" style={{ marginBottom: 0, fontSize: 12 }}
                  />
                </div>
                <button className="btn btn-gold btn-sm" onClick={() => loadVotes(selected)}>
                  Apply filters
                </button>
              </div>

              {/* Top stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <MiniStat value={total}
                  label="Total votes" color="var(--acid)" />
                <MiniStat value={new Set(votes.map(v => v.country_code)).size}
                  label="Countries" color="var(--cool)" />
                <MiniStat value={votes.filter(v => v.age_range).length}
                  label="With demographics" color="var(--gold)" />
              </div>

              {/* Bar + Pie charts */}
              {total > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                  <div className="panel" style={{ padding: '14px 14px 6px' }}>
                    <div className="section-label" style={{ marginBottom: 12 }}>RESULTS</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                        <XAxis dataKey="name"
                          tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                          axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => v + '%'}
                          tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                          axisLine={false} tickLine={false} domain={[0,100]} />
                        <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(200,255,0,0.04)' }} />
                        <Bar dataKey="pct" radius={[6,6,0,0]} maxBarSize={56}>
                          {barData.map((d,i) => <Cell key={i} fill={d.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel" style={{ padding: '14px 14px 6px' }}>
                    <div className="section-label" style={{ marginBottom: 12 }}>SHARE</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={64}
                          dataKey="value" strokeWidth={2} stroke="var(--bg)">
                          {pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Legend formatter={v => (
                          <span style={{ color: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-body)' }}>
                            {v.length > 14 ? v.slice(0,13)+'…' : v}
                          </span>
                        )} />
                        <Tooltip content={<ChartTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Votes over time */}
              {timeData.length > 1 && (
                <div className="panel" style={{ padding: '14px 14px 6px' }}>
                  <div className="section-label" style={{ marginBottom: 12 }}>VOTES OVER TIME</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={timeData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date"
                        tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                        axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Line
                        type="monotone" dataKey="count"
                        stroke="var(--acid)" strokeWidth={2}
                        dot={{ fill: 'var(--acid)', r: 3 }}
                        activeDot={{ r: 5 }} name="votes"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Country + demographics */}
              {total > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>

                  {countryData.length > 0 && (
                    <div className="card" style={{ padding: '14px 16px' }}>
                      <div className="section-label" style={{ marginBottom: 10 }}>BY COUNTRY</div>
                      {countryData.map(d => (
                        <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                          <span style={{ fontSize: 16 }}>{getFlag(d.code)}</span>
                          <span style={{
                            fontSize: 11, color: 'var(--muted)', width: 24,
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {d.code}
                          </span>
                          <div className="vote-bar-track" style={{ flex: 1 }}>
                            <div className="vote-bar-fill" style={{ width: d.pct + '%', background: 'var(--acid)' }} />
                          </div>
                          <span className="data-value data-value-sm"
                            style={{ color: 'var(--muted)', width: 30, textAlign: 'right' }}>
                            {d.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {ageData.length > 0 && (
                    <div className="card" style={{ padding: '14px 16px' }}>
                      <div className="section-label" style={{ marginBottom: 10 }}>BY AGE</div>
                      {ageData.map(d => (
                        <MiniBar key={d.key} label={d.key} pct={d.pct} color="var(--acid)" />
                      ))}
                    </div>
                  )}

                  {genderData.length > 0 && (
                    <div className="card" style={{ padding: '14px 16px' }}>
                      <div className="section-label" style={{ marginBottom: 10 }}>BY GENDER</div>
                      {genderData.map(d => (
                        <MiniBar key={d.key} label={d.key} pct={d.pct} color="var(--cool)" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty votes state */}
              {total === 0 && (
                <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🗳️</div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 20,
                    color: 'var(--muted)', marginBottom: 6,
                  }}>
                    NO VOTES YET
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted-2)' }}>
                    Share this poll to start collecting responses.
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
