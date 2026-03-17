import React, { useState, useEffect, useRef } from 'react';
import { db, COLORS, CATEGORIES } from '../lib/supabase';
import type { Question } from '../types';

// ─── Skeleton cards ──────────────────────────────────────────
const FeedSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[0, 1, 2, 3, 4].map(i => (
      <div
        key={i}
        className="skeleton"
        style={{ height: 110, borderRadius: 16, animationDelay: `${i * 80}ms` }}
      />
    ))}
  </div>
);

// ─── Poll card ───────────────────────────────────────────────
const PollCard = ({
  question,
  voteCount,
  voted,
  animDelay,
}: {
  question: Question;
  voteCount: number;
  voted: boolean;
  animDelay: number;
}) => {
  const cat = CATEGORIES.find(c => c.id === question.category);

  const timeAgo = (ts: string) => {
    const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (secs < 60)   return 'just now';
    if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  };

  return (
    <a
      href={`#/q/${question.id}`}
      className="card card-interactive animate-fade-in"
      style={{
        display: 'block',
        textDecoration: 'none',
        padding: '18px 20px',
        animationDelay: `${animDelay}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Category accent bar */}
      {cat && (
        <div
          className="poll-card-accent"
          style={{
            background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color}44, transparent)`,
          }}
        />
      )}

      {/* Top row: question + category badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <p
          className="font-heading"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#F5F5F5',
            lineHeight: 1.4,
            margin: 0,
            flex: 1,
          }}
        >
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

      {/* Options row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        {question.options.slice(0, 3).map((opt, i) => (
          <span
            key={i}
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              background: COLORS[i % COLORS.length] + '14',
              border: `1px solid ${COLORS[i % COLORS.length]}40`,
              color: COLORS[i % COLORS.length],
              whiteSpace: 'nowrap',
            }}
          >
            {opt}
          </span>
        ))}
        {question.options.length > 3 && (
          <span style={{ fontSize: 12, color: '#536280' }}>
            +{question.options.length - 3}
          </span>
        )}
      </div>

      {/* Bottom row: vote count, voted check, time */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Vote count */}
          <span
            className="data-value data-value-sm"
            style={{ color: '#8A9BB8' }}
          >
            {voteCount.toLocaleString()} {voteCount === 1 ? 'vote' : 'votes'}
          </span>

          {/* Voted indicator */}
          {voted && (
            <span
              className="badge badge-gold"
              style={{ fontSize: 10, padding: '2px 8px' }}
            >
              ✓ Voted
            </span>
          )}
        </div>

        <span style={{ fontSize: 11, color: '#536280', fontFamily: 'Inter, sans-serif' }}>
          {timeAgo(question.created_at)}
        </span>
      </div>
    </a>
  );
};

// ─── Empty state ─────────────────────────────────────────────
const EmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '64px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <div style={{ fontSize: 48 }}>{hasSearch ? '🔍' : '🌐'}</div>
    <h3
      className="font-heading"
      style={{ fontSize: 18, fontWeight: 600, color: '#C8D4E8', margin: 0 }}
    >
      {hasSearch ? 'No polls found' : 'No polls yet'}
    </h3>
    <p style={{ fontSize: 14, color: '#536280', margin: 0 }}>
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

// ─── Page ────────────────────────────────────────────────────
export const FeedPage = () => {
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(true);
  const [activeCat, setActiveCat]   = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy]         = useState<'new' | 'popular'>('new');
  const searchRef = useRef<HTMLInputElement>(null);

  // Read ?cat= from hash query on mount
  useEffect(() => {
    const hash  = window.location.hash; // e.g. #/feed?cat=Tech
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

  // Filter + sort
  const filtered = questions
    .filter(q => {
      if (activeCat !== 'All' && q.category !== activeCat) return false;
      if (searchQuery && !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const clearSearch = () => {
    setSearchQuery('');
    searchRef.current?.focus();
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* ── Sticky filter bar ─────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0, // desktop (sidebar layout, no topbar offset)
          background: 'rgba(8,15,30,0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
          padding: '14px 20px',
          zIndex: 30,
          marginBottom: 4,
        }}
        // On mobile the topbar is 60px, handled by .page-pad
      >
        {/* Page title + sort */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h2
            className="font-heading"
            style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5', margin: 0 }}
          >
            Feed
          </h2>

          {/* Sort toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(11,30,61,0.8)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {(['new', 'popular'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: '5px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                  background: sortBy === s ? 'rgba(212,175,55,0.2)' : 'transparent',
                  color: sortBy === s ? '#D4AF37' : '#536280',
                }}
              >
                {s === 'new' ? '🕐 New' : '🔥 Popular'}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span
            style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15, pointerEvents: 'none', color: '#536280',
            }}
          >
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
              onClick={clearSearch}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#536280', fontSize: 18, lineHeight: 1,
                padding: '2px 4px',
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Category chips */}
        <div
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}
        >
          {/* All chip */}
          <button
            onClick={() => setActiveCat('All')}
            className={`cat-chip ${activeCat === 'All' ? 'active' : ''}`}
            style={
              activeCat === 'All'
                ? {
                    background: 'linear-gradient(145deg, #E8C84A, #D4AF37)',
                    borderColor: '#D4AF37',
                    color: '#0B1E3D',
                  }
                : {}
            }
          >
            🌐 All
          </button>

          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`cat-chip ${activeCat === cat.id ? 'active' : ''}`}
              style={
                activeCat === cat.id
                  ? {
                      background: cat.color + '22',
                      borderColor: cat.color + '80',
                      color: cat.color,
                    }
                  : {}
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results summary ───────────────────── */}
      {!loading && (searchQuery || activeCat !== 'All') && (
        <div
          style={{
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 12, color: '#536280' }}>
            {filtered.length} {filtered.length === 1 ? 'poll' : 'polls'} found
            {activeCat !== 'All' ? ` in ${activeCat}` : ''}
            {searchQuery ? ` for "${searchQuery}"` : ''}
          </span>
          {(searchQuery || activeCat !== 'All') && (
            <button
              onClick={() => { setSearchQuery(''); setActiveCat('All'); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#D4AF37',
                fontFamily: 'Poppins, sans-serif', fontWeight: 600,
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Poll list ─────────────────────────── */}
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
                voted={localStorage.getItem('voted_' + q.id) !== null}
                animDelay={Math.min(i * 40, 320)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
