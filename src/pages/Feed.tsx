import React, { useState, useEffect, useRef } from 'react';
import { db, COLORS, CATEGORIES } from '../lib/supabase';
import type { Question } from '../types';

// ── Skeleton ──────────────────────────────────────────────────
const FeedSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[0, 1, 2, 3, 4].map(i => (
      <div key={i} className="skeleton" style={{ height: 110, animationDelay: `${i * 80}ms` }} />
    ))}
  </div>
);

// ── Poll card ─────────────────────────────────────────────────
const PollCard = ({
  question, voteCount, voted, animDelay,
}: {
  question: Question; voteCount: number; voted: boolean; animDelay: number;
}) => {
  const cat = CATEGORIES.find(c => c.id === question.category);

  const timeAgo = (ts: string) => {
    const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (secs < 60)    return 'just now';
    if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  };

  return (
    <a
      href={`#/q/${question.id}`}
      className="card card-interactive animate-fade-in"
      style={{
        display: 'block', textDecoration: 'none',
        padding: '18px 20px',
        animationDelay: `${animDelay}ms`, animationFillMode: 'both',
      }}
    >
      {cat && (
        <div
          className="poll-card-accent"
          style={{ background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color}22, transparent)` }}
        />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
          color: 'var(--text)', lineHeight: 1.4, margin: 0, flex: 1,
        }}>
          {question.question_text}
        </p>
        {cat && cat.id !== 'General' && (
          <span
            className="badge"
            style={{
              flexShrink: 0,
              background: cat.color + '15',
              border: `1px solid ${cat.color}45`,
              color: cat.color,
              fontSize: 10,
            }}
          >
            {cat.label.split(' ').slice(1).join(' ')}
          </span>
        )}
      </div>

      {/* Options pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {question.options.slice(0, 3).map((opt, i) => (
          <span
            key={i}
            style={{
              padding: '3px 10px', borderRadius: 'var(--radius-pill)',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
              background: COLORS[i % COLORS.length] + '14',
              border: `1px solid ${COLORS[i % COLORS.length]}40`,
              color: COLORS[i % COLORS.length)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {opt}
          </span>
        ))}
        {question.options.length > 3 && (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            +{question.options.length - 3}
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="data-value data-value-sm"
            style={{ color: 'var(--muted)' }}
          >
            {voteCount.toLocaleString()} {voteCount === 1 ? 'vote' : 'votes'}
          </span>
          {voted && (
            <span className="badge badge-gold" style={{ fontSize: 10, padding: '2px 8px' }}>
              ✓ Voted
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {timeAgo(question.created_at)}
        </span>
      </div>
    </a>
  );
};

// ── Empty state ───────────────────────────────────────────────
const EmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <div style={{
    textAlign: 'center', padding: '64px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  }}>
    <div style={{ fontSize: 48 }}>{hasSearch ? '🔍' : '🌐'}</div>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: 0, color: 'var(--text-2)' }}>
      {hasSearch ? 'No polls found' : 'No polls yet'}
    </h3>
    <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
      {hasSearch
        ? 'Try a different search or category.'
        : 'Be the first to ask the world something.'}
    </p>
    {!hasSearch && (
      <a href="#/post" className="btn btn-gold btn-md" style={{ marginTop: 8, textDecoration: 'none' }}>
        ✏️ Ask a question
      </a>
    )}
  </div>
);

// ── Page ──────────────────────────────────────────────────────
export const FeedPage = () => {
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [voteCounts, setVoteCounts]   = useState<Record<string, number>>({});
  const [loading, setLoading]         = useState(true);
  const [activeCat, setActiveCat]     = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]           = useState<'new' | 'popular'>('new');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hash  = window.location.hash;
    const match = hash.match(/[?&]cat=([^&]+)/);
    if (match) setActiveCat(decodeURIComponent(match[1]));
  }, []);

  useEffect(() => {
    Promise.all([
      db.from('questions').select('*').order('created_at', { ascending: false }),
      db.from('votes').select('question_id'),
    ]).then(([{ data: qs }, { data: vs }]) => {
      setQuestions(qs || []);
      const counts = (vs || []).reduce((acc: Record<string, number>, v: any) => {
        acc[v.question_id] = (acc[v.question_id] || 0) + 1;
        return acc;
      }, {});
      setVoteCounts(counts);
      setLoading(false);
    });
  }, []);

  const filtered = questions
    .filter(q => {
      if (activeCat !== 'All' && q.category !== activeCat) return false;
      if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Sticky filter bar ─────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0,
        background: 'rgba(10,10,15,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 20px', zIndex: 30, marginBottom: 4,
      }}>
        {/* Title + sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            letterSpacing: '0.02em', margin: 0, color: 'var(--text)',
          }}>
            FEED
          </h2>
          <div style={{
            display: 'flex', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {(['new', 'popular'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                transition: 'all 0.15s ease',
                background: sortBy === s ? 'var(--acid-dim)' : 'transparent',
                color: sortBy === s ? 'var(--acid)' : 'var(--muted)',
              }}>
                {s === 'new' ? '🕐 New' : '🔥 Popular'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, pointerEvents: 'none', color: 'var(--muted)',
          }}>
            🔍
          </span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search polls..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: 40, paddingRight: searchQuery ? 40 : 16 }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', fontSize: 20, lineHeight: 1, padding: '2px 4px',
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            onClick={() => setActiveCat('All')}
            className={`cat-chip ${activeCat === 'All' ? 'active' : ''}`}
            style={activeCat === 'All' ? {
              background: 'var(--acid)', borderColor: 'var(--acid)', color: '#0a0a0f',
            } : {}}
          >
            🌐 All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`cat-chip ${activeCat === cat.id ? 'active' : ''}`}
              style={activeCat === cat.id ? {
                background: cat.color + '22',
                borderColor: cat.color + '80',
                color: cat.color,
              } : {}}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────── */}
      {!loading && (searchQuery || activeCat !== 'All') && (
        <div style={{
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {filtered.length} {filtered.length === 1 ? 'poll' : 'polls'} found
            {activeCat !== 'All' ? ` in ${activeCat}` : ''}
            {searchQuery ? ` for "${searchQuery}"` : ''}
          </span>
          <button
            onClick={() => { setSearchQuery(''); setActiveCat('All'); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--acid)',
              fontFamily: 'var(--font-mono)', fontWeight: 600,
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Poll list ─────────────────────────────────────── */}
      <div style={{ padding: '8px 20px 32px' }}>
        {loading ? (
          <FeedSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!(searchQuery || activeCat !== 'All')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((q, i) => (
              <PollCard
                key={q.id}
                question={q}
                voteCount={voteCounts[q.id] || 0}
                voted={localStorage.getItem('vote_' + q.id) !== null}
                animDelay={Math.min(i * 40, 320)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
