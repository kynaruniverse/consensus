import React, { useState, useEffect } from 'react';
import { db, CATEGORIES } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { Question } from '../types';

// ─── Skeleton ───────────────────────────────────────────────
const HomeSkeleton = () => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
    <div className="skeleton" style={{ height: 48, width: '60%', marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 40 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
      {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
    </div>
    <div className="skeleton" style={{ height: 160, marginBottom: 40 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
    </div>
  </div>
);

// ─── Stat card ───────────────────────────────────────────────
const StatCard = ({
  icon, value, label, delay,
}: { icon: string; value: number; label: string; delay: number }) => (
  <div
    className="stat-card animate-fade-in"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div style={{ fontSize: 28, marginBottom: 8, lineHeight: 1 }}>{icon}</div>
    <div
      className="data-value data-value-lg"
      style={{ color: '#D4AF37', display: 'block', marginBottom: 4 }}
    >
      {value.toLocaleString()}
    </div>
    <div className="section-label" style={{ fontSize: 11 }}>{label}</div>
  </div>
);

// ─── Featured poll card ──────────────────────────────────────
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
      {/* Gold accent bar */}
      <div
        className="poll-card-accent"
        style={{ background: 'linear-gradient(90deg, #D4AF37, #CD7F32, #C0C0C0)' }}
      />

      {/* Live badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span className="live-dot" />
        <span className="section-label" style={{ color: '#D4AF37' }}>TRENDING NOW</span>
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

      {/* Question text */}
      <h2
        className="font-heading"
        style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5', marginBottom: 16, lineHeight: 1.3 }}
      >
        {question.question_text}
      </h2>

      {/* Options preview */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {question.options.slice(0, 3).map((opt, i) => (
          <span
            key={i}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              background: 'rgba(11,30,61,0.7)',
              border: '1px solid rgba(212,175,55,0.2)',
              color: '#C8D4E8',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {opt}
          </span>
        ))}
        {question.options.length > 3 && (
          <span style={{ fontSize: 13, color: '#536280', alignSelf: 'center' }}>
            +{question.options.length - 3} more
          </span>
        )}
      </div>

      {/* CTA row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#D4AF37',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'gap 0.2s ease',
          }}
        >
          Vote now →
        </span>
        <span style={{ fontSize: 12, color: '#536280' }}>
          {question.options.length} options
        </span>
      </div>
    </div>
  );
};

// ─── Category card ───────────────────────────────────────────
const CatCard = ({
  cat, idx,
}: { cat: typeof CATEGORIES[0]; idx: number }) => (
  <div
    className="card card-interactive animate-fade-in"
    style={{
      padding: '18px 16px',
      animationDelay: `${300 + idx * 60}ms`,
      animationFillMode: 'both',
      cursor: 'pointer',
    }}
    onClick={() => navigate(`/feed?cat=${cat.id}`)}
    role="button"
    tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && navigate(`/feed?cat=${cat.id}`)}
  >
    {/* Colour accent top bar */}
    <div
      className="poll-card-accent"
      style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88, transparent)` }}
    />

    <div style={{ fontSize: 26, marginBottom: 8, lineHeight: 1 }}>
      {cat.label.split(' ')[0]}
    </div>
    <div
      style={{
        fontFamily: 'Poppins, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        color: '#C8D4E8',
      }}
    >
      {cat.label.split(' ').slice(1).join(' ')}
    </div>
  </div>
);

// ─── How it works ────────────────────────────────────────────
const HOW_STEPS = [
  { icon: '✏️', title: 'Ask anything',   body: 'Post a question with 2–4 options in seconds.' },
  { icon: '🗳️', title: 'World votes',    body: 'Anyone, anywhere can vote — no account needed.' },
  { icon: '📊', title: 'See it live',    body: 'Watch results update in real time by country and demographic.' },
  { icon: '🔮', title: 'Predict & rank', body: 'Guess the winning option before you vote to climb the leaderboard.' },
];

// ─── Page ────────────────────────────────────────────────────
export const HomePage = () => {
  const [stats, setStats]       = useState({ questions: 0, votes: 0, countries: 0 });
  const [featured, setFeatured] = useState<Question | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      db.from('questions').select('id', { count: 'exact', head: true }),
      db.from('votes').select('id', { count: 'exact', head: true }),
      db.from('votes').select('country_code').neq('country_code', 'XX').neq('country_code', null),
      // Featured = most-voted question in last 7 days
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
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 40px' }}>

      {/* ── Hero ──────────────────────────────── */}
      <div className="animate-fade-in" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="live-dot" />
          <span className="section-label" style={{ color: '#D4AF37' }}>LIVE GLOBAL POLLING</span>
        </div>

        <h1
          className="font-heading"
          style={{ marginBottom: 12, lineHeight: 1.15 }}
        >
          <span style={{ color: '#F5F5F5' }}>The World's</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #E8C84A 0%, #D4AF37 45%, #C0C0C0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Opinion, Live
          </span>
        </h1>

        <p style={{ color: '#8A9BB8', fontSize: 16, maxWidth: 520, lineHeight: 1.65 }}>
          Vote on anything. See real-time results from around the planet —
          broken down by country, age, and gender. No bias, just data.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            className="btn btn-gold btn-lg"
            onClick={() => navigate('/feed')}
          >
            Browse polls
          </button>
          <button
            className="btn btn-ghost btn-lg"
            onClick={() => navigate('/post')}
          >
            ✏️ Ask a question
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 36,
        }}
      >
        <StatCard icon="❓" value={stats.questions} label="Questions asked" delay={0}   />
        <StatCard icon="🗳️" value={stats.votes}     label="Votes cast"      delay={80}  />
        <StatCard icon="🌍" value={stats.countries} label="Countries"        delay={160} />
      </div>

      {/* ── Featured poll ─────────────────────── */}
      {featured && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="section-label">FEATURED POLL</span>
          </div>
          <FeaturedCard question={featured} />
        </div>
      )}

      {/* ── Categories ────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="section-label">BROWSE BY TOPIC</span>
          <button
            onClick={() => navigate('/feed')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#D4AF37', fontFamily: 'Poppins, sans-serif',
              fontSize: 12, fontWeight: 600,
            }}
          >
            See all →
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {CATEGORIES.map((cat, idx) => (
            <CatCard key={cat.id} cat={cat} idx={idx} />
          ))}
        </div>
      </div>

      {/* ── How it works ──────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span className="section-label">HOW IT WORKS</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {HOW_STEPS.map((step, i) => (
            <div
              key={i}
              className="card animate-fade-in"
              style={{
                padding: 20,
                animationDelay: `${i * 80}ms`,
                animationFillMode: 'both',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 10 }}>{step.icon}</div>
              <div
                className="font-heading"
                style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F5', marginBottom: 6 }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: 13, color: '#8A9BB8', lineHeight: 1.55 }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
