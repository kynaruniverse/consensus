import React, { useState, useEffect } from 'react';
import { db, CATEGORIES } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { Question } from '../types';

// ── Skeleton ──────────────────────────────────────────────────
const HomeSkeleton = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
    <div className="skeleton" style={{ height: 80, width: '70%', marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 40 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
      {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
    </div>
    <div className="skeleton" style={{ height: 180, marginBottom: 40 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
    </div>
  </div>
);

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ value, label, delay }: { value: number; label: string; delay: number }) => (
  <div
    className="stat-card animate-fade-in"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div
      className="data-value data-value-lg"
      style={{ color: 'var(--acid)', display: 'block', marginBottom: 6 }}
    >
      {value.toLocaleString()}
    </div>
    <div className="section-label">{label}</div>
  </div>
);

// ── Featured poll card ────────────────────────────────────────
const FeaturedCard = ({ question }: { question: Question }) => {
  const cat = CATEGORIES.find(c => c.id === question.category);
  return (
    <div
      className="card card-interactive animate-fade-in"
      style={{ padding: 24, animationDelay: '200ms', animationFillMode: 'both' }}
      onClick={() => navigate(`/q/${question.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/q/${question.id}`)}
    >
      {/* Accent bar */}
      <div
        className="poll-card-accent"
        style={{ background: `linear-gradient(90deg, var(--hot), var(--acid))` }}
      />

      {/* Tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span className="live-dot" />
        <span className="section-label" style={{ color: 'var(--hot)' }}>TRENDING NOW</span>
        {cat && (
          <span
            className="badge"
            style={{
              marginLeft: 'auto',
              background: cat.color + '18',
              border: `1px solid ${cat.color}50`,
              color: cat.color,
            }}
          >
            {cat.label}
          </span>
        )}
      </div>

      {/* Question */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          letterSpacing: '0.02em',
          color: 'var(--text)',
          marginBottom: 16,
          lineHeight: 1.1,
        }}
      >
        {question.question_text}
      </h2>

      {/* Option pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {question.options.slice(0, 3).map((opt, i) => (
          <span
            key={i}
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: 'var(--surface2)',
              border: '1px solid var(--border-mid)',
              color: 'var(--text-2)',
            }}
          >
            {opt}
          </span>
        ))}
        {question.options.length > 3 && (
          <span style={{ fontSize: 13, color: 'var(--muted)', alignSelf: 'center' }}>
            +{question.options.length - 3} more
          </span>
        )}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
          color: 'var(--acid)', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Vote now →
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {question.options.length} options
        </span>
      </div>
    </div>
  );
};

// ── Category card ─────────────────────────────────────────────
const CatCard = ({ cat, idx }: { cat: typeof CATEGORIES[0]; idx: number }) => (
  <div
    className="card card-interactive animate-fade-in"
    style={{
      padding: '16px 14px',
      animationDelay: `${300 + idx * 50}ms`,
      animationFillMode: 'both',
      cursor: 'pointer',
    }}
    onClick={() => navigate(`/feed?cat=${cat.id}`)}
    role="button"
    tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && navigate(`/feed?cat=${cat.id}`)}
  >
    <div
      className="poll-card-accent"
      style={{ background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color}22, transparent)` }}
    />
    <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>
      {cat.label.split(' ')[0]}
    </div>
    <div style={{
      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--text-2)',
    }}>
      {cat.label.split(' ').slice(1).join(' ')}
    </div>
  </div>
);

// ── How it works ──────────────────────────────────────────────
const HOW_STEPS = [
  { num: '01', title: 'Ask anything',   body: 'Post a question with 2–4 options in seconds.', accent: 'var(--acid)'  },
  { num: '02', title: 'World votes',    body: 'Anyone, anywhere can vote — one answer per person, forever.', accent: 'var(--cool)' },
  { num: '03', title: 'See it live',    body: 'Watch results update in real time by country and demographic.', accent: 'var(--hot)'  },
  { num: '04', title: 'Predict & rank', body: 'Guess the winning option before you vote to climb the leaderboard.', accent: 'var(--gold)' },
];

// ── Page ──────────────────────────────────────────────────────
export const HomePage = () => {
  const [stats, setStats]       = useState({ questions: 0, votes: 0, countries: 0 });
  const [featured, setFeatured] = useState<Question | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      db.from('questions').select('id', { count: 'exact', head: true }),
      db.from('votes').select('id', { count: 'exact', head: true }),
      db.from('votes').select('country_code').neq('country_code', 'XX').neq('country_code', null),
      db.from('questions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([
      { count: qCount },
      { count: vCount },
      { data: cData },
      { data: recent },
    ]) => {
      const countries = new Set((cData || []).map((v: any) => v.country_code)).size;
      setStats({ questions: qCount || 0, votes: vCount || 0, countries });
      setFeatured((recent as Question[])?.[0] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) return <HomeSkeleton />;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 48px' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="animate-fade-in" style={{ marginBottom: 40 }}>

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--acid-dim)',
          border: '1px solid var(--acid-mid)',
          borderRadius: 'var(--radius-sm)',
          padding: '5px 12px',
          marginBottom: 20,
        }}>
          <span className="live-dot" />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--acid)',
          }}>
            Live Global Polling
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(52px, 10vw, 80px)',
            lineHeight: 0.92,
            letterSpacing: '0.02em',
            marginBottom: 20,
          }}
        >
          THE<br />
          <span style={{ color: 'var(--acid)' }}>WORLD'S</span><br />
          <span style={{ color: 'var(--muted)' }}>OPINION.</span>
        </h1>

        <p style={{
          fontSize: 15, lineHeight: 1.65, color: 'var(--muted)',
          maxWidth: 480, marginBottom: 28,
        }}>
          Vote on anything. See real-time results broken down by{' '}
          <span style={{ color: 'var(--text)' }}>country, age, and gender</span>.
          No bias, just data.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-gold btn-lg" onClick={() => navigate('/feed')}>
            ⚡ Browse Polls
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/post')}>
            ✏️ Ask a Question
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
        <StatCard value={stats.questions} label="Questions Asked" delay={0}   />
        <StatCard value={stats.votes}     label="Votes Cast"      delay={80}  />
        <StatCard value={stats.countries} label="Countries"       delay={160} />
      </div>

      {/* ── Featured poll ─────────────────────────────────── */}
      {featured && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="section-label" style={{ fontSize: 11 }}>FEATURED POLL</span>
            <button
              onClick={() => navigate('/feed')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--acid)', fontFamily: 'var(--font-mono)',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              }}
            >
              SEE ALL →
            </button>
          </div>
          <FeaturedCard question={featured} />
        </div>
      )}

      {/* ── Categories ────────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="section-label" style={{ fontSize: 11 }}>BROWSE BY TOPIC</span>
          <button
            onClick={() => navigate('/feed')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--acid)', fontFamily: 'var(--font-mono)',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            }}
          >
            SEE ALL →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {CATEGORIES.map((cat, idx) => <CatCard key={cat.id} cat={cat} idx={idx} />)}
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <span className="section-label" style={{ fontSize: 11, display: 'block', marginBottom: 20 }}>
          HOW IT WORKS
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {HOW_STEPS.map((step, i) => (
            <div
              key={i}
              className="animate-fade-in"
              style={{
                display: 'flex', gap: 20, paddingBottom: 24,
                borderBottom: i < HOW_STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                marginBottom: 24,
                animationDelay: `${i * 80}ms`, animationFillMode: 'both',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1,
                color: 'var(--border-bright)', flexShrink: 0, width: 52,
              }}>
                {step.num}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{
                  fontFamily: 'var(--font-body)', fontWeight: 700,
                  fontSize: 16, color: 'var(--text)', marginBottom: 4,
                }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                  {step.body}
                </div>
                <span style={{
                  display: 'inline-block', marginTop: 10,
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                  background: step.accent + '18',
                  color: step.accent,
                  border: `1px solid ${step.accent}30`,
                }}>
                  {i === 0 ? 'Free' : i === 1 ? 'Global' : i === 2 ? 'Real-time' : 'Pro'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upgrade banner ────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: 28, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, var(--acid-dim) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <span style={{
            display: 'inline-block', marginBottom: 12,
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: 'var(--gold)', background: 'var(--gold-dim)',
            border: '1px solid var(--gold-mid)',
            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
          }}>
            ✦ Pro / Business
          </span>
          <h2 style={{ fontSize: 32, marginBottom: 10, lineHeight: 1.05 }}>
            Turn opinions into <span style={{ color: 'var(--acid)' }}>insights</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20, maxWidth: 480 }}>
            Get full demographic breakdowns behind every vote. Know who thinks what —
            and why it matters for your business.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {[
              'Age, gender & country breakdowns',
              'Unlimited professional questions',
              'Export raw data as CSV',
              'Priority poll placement',
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--acid)', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
          <button
            className="btn btn-gold btn-lg"
            onClick={() => navigate('/auth')}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            Upgrade to Pro →
          </button>
        </div>
      </div>

    </div>
  );
};
