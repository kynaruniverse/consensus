import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';

interface UserScore {
  user_id:  string;
  username: string;
  correct:  number;
  total:    number;
  accuracy: number;
}

const AccuracyColor = (pct: number) =>
  pct >= 80 ? 'var(--acid)' : pct >= 60 ? 'var(--gold)' : 'var(--muted)';

export const LeaderboardPage = () => {
  const [scores, setScores]   = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder until Supabase RPC is built
    const mock: UserScore[] = [
      { user_id: '1', username: 'crypticmind',   correct: 42, total: 50, accuracy: 84 },
      { user_id: '2', username: 'worldwatcher',  correct: 38, total: 47, accuracy: 81 },
      { user_id: '3', username: 'opinionmaster', correct: 35, total: 45, accuracy: 78 },
      { user_id: '4', username: 'globalguru',    correct: 31, total: 42, accuracy: 74 },
      { user_id: '5', username: 'pollpro',       correct: 28, total: 40, accuracy: 70 },
      { user_id: '6', username: 'trendseeker',   correct: 22, total: 34, accuracy: 65 },
      { user_id: '7', username: 'datadiver',     correct: 18, total: 30, accuracy: 60 },
    ];
    setTimeout(() => { setScores(mock); setLoading(false); }, 0);
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  const top3 = scores.slice(0, 3);
  const rest  = scores.slice(3);

  const podiumBorder = ['var(--muted)', 'var(--acid)', '#cd7f32'];
  const podiumHeight = [120, 148, 110];
  const podiumOrder  = [1, 0, 2]; // display: 2nd, 1st, 3rd

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 48px' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 8vw, 56px)',
          letterSpacing: '0.02em', marginBottom: 8,
        }}>
          LEADERBOARD
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Top predictors ranked by accuracy. Guess the winning option before voting to climb the ranks.
        </p>
      </div>

      {/* Podium */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 24, alignItems: 'flex-end',
      }}>
        {podiumOrder.map((rankIdx, col) => {
          const score  = top3[rankIdx];
          const medals = ['🥇', '🥈', '🥉'];
          if (!score) return <div key={col} />;
          return (
            <div
              key={col}
              className="card animate-fade-in"
              style={{
                padding: col === 1 ? '20px 12px' : '16px 12px',
                textAlign: 'center',
                minHeight: podiumHeight[rankIdx],
                border: `1px solid ${podiumBorder[rankIdx]}40`,
                boxShadow: rankIdx === 0 ? `0 0 20px ${podiumBorder[rankIdx]}18` : 'none',
                animationDelay: `${col * 100}ms`, animationFillMode: 'both',
              }}
            >
              <div style={{ fontSize: col === 1 ? 32 : 26, marginBottom: 6 }}>
                {medals[rankIdx]}
              </div>
              <div
                className="avatar avatar-md"
                style={{
                  margin: '0 auto 8px',
                  borderColor: podiumBorder[rankIdx],
                  ...(rankIdx === 0 ? { boxShadow: `0 0 12px ${podiumBorder[rankIdx]}40` } : {}),
                }}
              >
                {score.username[0].toUpperCase()}
              </div>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: col === 1 ? 13 : 12,
                fontWeight: 700, color: 'var(--text)', marginBottom: 4,
              }}>
                {score.username}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 600,
                fontSize: col === 1 ? 20 : 14,
                color: podiumBorder[rankIdx],
              }}>
                {score.accuracy}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of table */}
      {rest.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px',
            gap: 8, padding: '10px 16px',
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
          }}>
            {['#', 'User', 'Correct', 'Accuracy'].map((h, i) => (
              <div key={h} className="section-label" style={{ textAlign: i > 1 ? 'right' : 'left' }}>
                {h}
              </div>
            ))}
          </div>

          {rest.map((score, idx) => {
            const rank = idx + 4;
            return (
              <div key={score.user_id} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px',
                gap: 8, padding: '13px 16px', alignItems: 'center',
                borderBottom: idx < rest.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)',
                }}>
                  #{rank}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar avatar-sm">
                    {score.username[0].toUpperCase()}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                    color: 'var(--text-2)',
                  }}>
                    {score.username}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)',
                  textAlign: 'right',
                }}>
                  {score.correct}/{score.total}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                  color: AccuracyColor(score.accuracy), textAlign: 'right',
                }}>
                  {score.accuracy}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* How to climb */}
      <div style={{
        padding: '16px 20px', borderRadius: 'var(--radius-lg)',
        background: 'var(--acid-dim)',
        border: '1px solid var(--acid-mid)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🎯</span>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              color: 'var(--acid)', marginBottom: 6,
            }}>
              How to climb the ranks
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              When you open a poll, predict the winning option <em>before</em> you vote.
              Correct predictions earn accuracy points. The more accurate you are, the higher you rank.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
