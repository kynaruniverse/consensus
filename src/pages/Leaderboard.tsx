import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';

interface UserScore {
  user_id:  string;
  username: string;
  correct:  number;
  total:    number;
  accuracy: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const AccuracyColor = (pct: number) =>
  pct >= 80 ? '#D4AF37' : pct >= 60 ? '#CD7F32' : '#C0C0C0';

export const LeaderboardPage = () => {
  const [scores, setScores]   = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real implementation would use a Supabase RPC function
    // that joins profiles → predictions → votes and calculates accuracy.
    // Showing realistic placeholder data until that function is built.
    const mock: UserScore[] = [
      { user_id: '1', username: 'crypticmind',   correct: 42, total: 50, accuracy: 84 },
      { user_id: '2', username: 'worldwatcher',  correct: 38, total: 47, accuracy: 81 },
      { user_id: '3', username: 'opinionmaster', correct: 35, total: 45, accuracy: 78 },
      { user_id: '4', username: 'globalguru',    correct: 31, total: 42, accuracy: 74 },
      { user_id: '5', username: 'pollpro',       correct: 28, total: 40, accuracy: 70 },
      { user_id: '6', username: 'trendseeker',   correct: 22, total: 34, accuracy: 65 },
      { user_id: '7', username: 'datadiver',     correct: 18, total: 30, accuracy: 60 },
    ];
    setScores(mock);
    setLoading(false);
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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 40px' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 28 }}>
        <h1 className="font-heading" style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          Leaderboard
        </h1>
        <p style={{ fontSize: 14, color: '#8A9BB8' }}>
          Top predictors ranked by accuracy. Guess the winning option before voting to climb the ranks.
        </p>
      </div>

      {/* ── Podium (top 3) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, marginBottom: 24, alignItems: 'flex-end',
      }}>
        {/* 2nd place */}
        <div className="card animate-fade-in" style={{
          padding: '16px 12px', textAlign: 'center',
          animationDelay: '100ms', animationFillMode: 'both',
          minHeight: 120,
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🥈</div>
          <div className="avatar avatar-md" style={{
            margin: '0 auto 8px',
            border: '2px solid #C0C0C0',
          }}>
            {(top3[1]?.username || '?')[0].toUpperCase()}
          </div>
          <div className="font-heading" style={{ fontSize: 12, fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
            {top3[1]?.username}
          </div>
          <div className="data-value data-value-sm" style={{ color: '#C0C0C0' }}>
            {top3[1]?.accuracy}%
          </div>
        </div>

        {/* 1st place — taller */}
        <div className="card animate-fade-in" style={{
          padding: '20px 12px', textAlign: 'center',
          border: '1px solid rgba(212,175,55,0.35)',
          boxShadow: '0 0 20px rgba(212,175,55,0.12)',
          animationFillMode: 'both',
          minHeight: 148,
        }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🥇</div>
          <div className="avatar avatar-md" style={{
            margin: '0 auto 8px',
            border: '2px solid #D4AF37',
            boxShadow: '0 0 10px rgba(212,175,55,0.3)',
          }}>
            {(top3[0]?.username || '?')[0].toUpperCase()}
          </div>
          <div className="font-heading" style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5', marginBottom: 4 }}>
            {top3[0]?.username}
          </div>
          <div className="data-value data-value-md" style={{ color: '#D4AF37' }}>
            {top3[0]?.accuracy}%
          </div>
        </div>

        {/* 3rd place */}
        <div className="card animate-fade-in" style={{
          padding: '16px 12px', textAlign: 'center',
          animationDelay: '200ms', animationFillMode: 'both',
          minHeight: 110,
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🥉</div>
          <div className="avatar avatar-md" style={{
            margin: '0 auto 8px',
            border: '2px solid #CD7F32',
          }}>
            {(top3[2]?.username || '?')[0].toUpperCase()}
          </div>
          <div className="font-heading" style={{ fontSize: 12, fontWeight: 600, color: '#F5F5F5', marginBottom: 4 }}>
            {top3[2]?.username}
          </div>
          <div className="data-value data-value-sm" style={{ color: '#CD7F32' }}>
            {top3[2]?.accuracy}%
          </div>
        </div>
      </div>

      {/* ── Rest of table ── */}
      {rest.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px',
            gap: 8, padding: '10px 16px',
            background: 'rgba(11,30,61,0.6)',
            borderBottom: '1px solid rgba(212,175,55,0.1)',
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
                borderBottom: idx < rest.length - 1 ? '1px solid rgba(212,175,55,0.07)' : 'none',
              }}>
                <span className="data-value data-value-sm" style={{ color: '#536280' }}>
                  #{rank}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="avatar avatar-sm"
                    style={{ border: '2px solid rgba(212,175,55,0.2)' }}>
                    {score.username[0].toUpperCase()}
                  </div>
                  <span className="font-heading" style={{ fontSize: 13, fontWeight: 500, color: '#C8D4E8' }}>
                    {score.username}
                  </span>
                </div>
                <span className="data-value data-value-sm" style={{ color: '#8A9BB8', textAlign: 'right' }}>
                  {score.correct}/{score.total}
                </span>
                <span className="data-value data-value-sm"
                  style={{ color: AccuracyColor(score.accuracy), textAlign: 'right' }}>
                  {score.accuracy}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── How to climb ── */}
      <div style={{
        padding: '16px 18px', borderRadius: 12,
        background: 'rgba(212,175,55,0.05)',
        border: '1px solid rgba(212,175,55,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🎯</span>
          <div>
            <div className="font-heading" style={{ fontSize: 13, fontWeight: 600, color: '#D4AF37', marginBottom: 4 }}>
              How to climb the ranks
            </div>
            <p style={{ fontSize: 13, color: '#8A9BB8', margin: 0, lineHeight: 1.6 }}>
              When you open a poll, predict the winning option <em>before</em> you vote.
              Correct predictions earn accuracy points. The more accurate you are, the higher you rank.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
