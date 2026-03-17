import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  db, COLORS, CATEGORIES, getFlag,
  getLocalVote, setLocalVote,
  getLocalPrediction, setLocalPrediction,
  getCountryCode, timeAgo,
} from '../lib/supabase';
import { useRealtimeVotes } from '../hooks/useRealtimeVotes';
import { useMeta } from '../hooks/useMeta';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import type { Question, Vote, Comment } from '../types';
import type { Profile } from '../types';

/* ─────────────────────── helpers ─────────────────────────── */

function fireConfetti() {
  try {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    import('canvas-confetti').then(({ default: confetti }) => {
      const c = confetti.create(canvas, { resize: true, useWorker: true });
      c({ particleCount: 120, spread: 80, origin: { y: 0.55 },
          colors: ['#D4AF37','#E8C84A','#C0C0C0','#CD7F32','#F5F5F5'] });
    });
  } catch (_) {}
}

/* ─────────────────────── skeleton ────────────────────────── */

const QuestionSkeleton = () => (
  <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px' }}>
    <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 20 }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <div className="skeleton" style={{ height: 36, width: '90%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 18, width: 140, marginBottom: 32 }} />
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 10 }} />)}
      </div>
      <div>
        <div className="skeleton" style={{ height: 220, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    </div>
  </div>
);

/* ─────────────────────── prediction ──────────────────────── */

const PredictionWidget = ({ question, myPrediction, predLocked, onPredict }: {
  question: Question; myPrediction: number | null;
  predLocked: boolean; onPredict: (i: number) => void;
}) => (
  <div style={{
    background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 14, padding: 16,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 18 }}>🔮</span>
      <div>
        <div className="font-heading" style={{ fontSize: 13, fontWeight: 600, color: '#D4AF37' }}>
          {myPrediction !== null ? 'Prediction locked in!' : 'Predict the winner'}
        </div>
        <div style={{ fontSize: 11, color: '#536280' }}>
          {myPrediction !== null
            ? 'Vote to see if you were right'
            : 'Guess before voting to score leaderboard points'}
        </div>
      </div>
    </div>
    {myPrediction === null ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {question.options.map((opt, i) => (
          <button key={i} onClick={() => onPredict(i)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderRadius: 10, background: 'rgba(11,30,61,0.6)',
            border: '1px solid rgba(212,175,55,0.15)', cursor: 'pointer',
            textAlign: 'left', fontFamily: 'Inter, sans-serif', width: '100%',
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
              background: COLORS[i % COLORS.length] + '25',
              color: COLORS[i % COLORS.length],
            }}>{i + 1}</span>
            <span style={{ fontSize: 13, color: '#C8D4E8' }}>{opt}</span>
          </button>
        ))}
      </div>
    ) : (
      <div style={{
        padding: '10px 14px', borderRadius: 10,
        border: `1px solid ${COLORS[myPrediction % COLORS.length]}40`,
        background: COLORS[myPrediction % COLORS.length] + '10',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
          color: COLORS[myPrediction % COLORS.length] }}>
          🔒 {question.options[myPrediction]}
        </span>
      </div>
    )}
  </div>
);

/* ─────────────────────── reveal banner ───────────────────── */

const RevealBanner = ({ correct, predictedOpt, winnerOpt }: {
  correct: boolean; predictedOpt: string; winnerOpt: string;
}) => (
  <div className="animate-bounce-in" style={{
    padding: '16px 20px', borderRadius: 14, textAlign: 'center',
    background: correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
    border: `1px solid ${correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
  }}>
    <div style={{ fontSize: 32, marginBottom: 6 }}>{correct ? '🎯' : '😬'}</div>
    <div className="font-heading" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4,
      color: correct ? '#34d399' : '#f87171' }}>
      {correct ? 'Nailed it!' : 'Not quite!'}
    </div>
    <div style={{ fontSize: 12, color: '#8A9BB8' }}>
      {correct
        ? `Your prediction was right — ${winnerOpt} is winning!`
        : `You predicted "${predictedOpt}" but "${winnerOpt}" is leading.`}
    </div>
  </div>
);

/* ─────────────────────── vote button ─────────────────────── */

const VoteButton = ({ opt, idx, count, total, myVote, isWinner, voting, onVote }: {
  opt: string; idx: number; count: number; total: number;
  myVote: number | null; isWinner: boolean; voting: boolean;
  onVote: (i: number) => void;
}) => {
  const voted = myVote !== null;
  const isMe  = myVote === idx;
  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = COLORS[idx % COLORS.length];

  return (
    <button className={`vote-option${isMe ? ' voted-mine' : ''}`}
      onClick={() => onVote(idx)} disabled={voted || voting}>
      {voted && (
        <div className="vote-fill"
          style={{ width: pct + '%', background: `linear-gradient(90deg, ${color}28, ${color}0a)` }} />
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: color, boxShadow: voted && isMe ? `0 0 8px ${color}` : 'none' }} />
          <span style={{ fontSize: 14, fontWeight: isMe ? 600 : 400,
            color: isMe ? '#F5F5F5' : '#C8D4E8', fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {opt}
          </span>
          {isMe && <span className="badge badge-gold" style={{ fontSize: 10, padding: '2px 7px', flexShrink: 0 }}>✓ You</span>}
          {isWinner && voted && <span style={{ fontSize: 14, flexShrink: 0 }}>🏆</span>}
        </div>
        {voted && (
          <span className="data-value data-value-md" style={{ color, flexShrink: 0 }}>{pct}%</span>
        )}
      </div>
    </button>
  );
};

/* ─────────────────────── bar chart ───────────────────────── */

const ResultsBarChart = ({ question, votes }: { question: Question; votes: Vote[] }) => {
  const total = votes.length;
  const data  = question.options.map((opt, i) => ({
    name:  opt.length > 14 ? opt.slice(0, 13) + '…' : opt,
    full:  opt,
    pct:   total > 0 ? Math.round((votes.filter(v => v.option_index === i).length / total) * 100) : 0,
    count: votes.filter(v => v.option_index === i).length,
    color: COLORS[i % COLORS.length],
  }));

  const Tip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: '#0F2244', border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 10, padding: '10px 14px', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
        <div style={{ color: '#F5F5F5', marginBottom: 4, fontWeight: 600 }}>{d.full}</div>
        <span className="data-value" style={{ fontSize: 16, color: d.color }}>{d.pct}%</span>
        <span style={{ color: '#536280', marginLeft: 8 }}>({d.count} votes)</span>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
        <XAxis dataKey="name" tick={{ fill: '#536280', fontSize: 11, fontFamily: 'Roboto Mono, monospace' }}
          axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v => v + '%'} tick={{ fill: '#536280', fontSize: 10, fontFamily: 'Roboto Mono, monospace' }}
          axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<Tip />} cursor={{ fill: 'rgba(212,175,55,0.05)' }} />
        <Bar dataKey="pct" radius={[6,6,0,0]} maxBarSize={64}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ─────────────────────── pie chart ───────────────────────── */

const ResultsPieChart = ({ question, votes }: { question: Question; votes: Vote[] }) => {
  const total = votes.length;
  const data  = question.options
    .map((opt, i) => ({
      name: opt, value: votes.filter(v => v.option_index === i).length,
      color: COLORS[i % COLORS.length],
    }))
    .filter(d => d.value > 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.08) return null;
    const R = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    return (
      <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
        fill="#0B1E3D" textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700} fontFamily="Roboto Mono, monospace">
        {Math.round(percent * 100)}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={<CustomLabel />}
          outerRadius={80} dataKey="value" strokeWidth={2} stroke="#0B1E3D">
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Legend formatter={v => (
          <span style={{ color: '#8A9BB8', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
            {v.length > 16 ? v.slice(0,15) + '…' : v}
          </span>
        )} />
        <Tooltip contentStyle={{ background: '#0F2244', border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 12 }}
          formatter={(value: number) => [value + ' votes', '']} />
      </PieChart>
    </ResponsiveContainer>
  );
};

/* ─────────────────────── country bars ────────────────────── */

const CountryBreakdown = ({ votes, total }: { votes: Vote[]; total: number }) => {
  const countries = Object.entries(
    votes.reduce((acc: Record<string, number>, v) => {
      const c = v.country_code || 'XX'; acc[c] = (acc[c] || 0) + 1; return acc;
    }, {})
  ).sort((a,b) => b[1] - a[1]).slice(0, 6);

  if (!countries.length) return null;
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 10 }}>🌍 BY COUNTRY</div>
      {countries.map(([code, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{getFlag(code)}</span>
            <span style={{ fontSize: 11, color: '#8A9BB8', width: 28, flexShrink: 0,
              fontFamily: 'Roboto Mono, monospace' }}>{code}</span>
            <div className="vote-bar-track" style={{ flex: 1 }}>
              <div className="vote-bar-fill" style={{ width: pct + '%', background: '#D4AF37' }} />
            </div>
            <span className="data-value data-value-sm" style={{ color: '#8A9BB8', width: 32, textAlign: 'right' }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────── demo bars ───────────────────────── */

const DemoBreakdown = ({ label, data, total, color }: {
  label: string; data: Record<string, number>; total: number; color: string;
}) => {
  const entries = Object.entries(data).sort((a,b) => b[1] - a[1]);
  if (!entries.length || !total) return null;
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 10 }}>{label}</div>
      {entries.map(([key, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#8A9BB8', width: 72, flexShrink: 0,
              fontFamily: 'Inter, sans-serif' }}>{key}</span>
            <div className="vote-bar-track" style={{ flex: 1 }}>
              <div className="vote-bar-fill" style={{ width: pct + '%', background: color }} />
            </div>
            <span className="data-value data-value-sm" style={{ color: '#8A9BB8', width: 32, textAlign: 'right' }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────── people like you ─────────────────── */

const PeopleLikeYou = ({ question, votes, user }: {
  question: Question; votes: Vote[]; user?: Profile | null;
}) => {
  if (!user?.age_range && !user?.gender) return null;
  const similar = votes.filter(v =>
    (user.age_range ? v.age_range === user.age_range : true) &&
    (user.gender    ? v.gender    === user.gender    : true)
  );
  if (similar.length < 2) return null;
  const total = similar.length;

  return (
    <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)',
      borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>👥</span>
        <span className="section-label" style={{ color: '#D4AF37' }}>PEOPLE LIKE YOU</span>
        <span style={{ fontSize: 11, color: '#536280', marginLeft: 'auto' }}>
          {total} {user.age_range || ''} {user.gender || ''}
        </span>
      </div>
      {question.options.map((opt, i) => {
        const count = similar.filter(v => v.option_index === i).length;
        const pct   = Math.round((count / total) * 100);
        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#C8D4E8', fontFamily: 'Inter, sans-serif' }}>{opt}</span>
              <span className="data-value data-value-sm" style={{ color: COLORS[i % COLORS.length] }}>{pct}%</span>
            </div>
            <div className="vote-bar-track" style={{ height: 6 }}>
              <div className="vote-bar-fill" style={{ width: pct + '%', background: COLORS[i % COLORS.length] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────── comments ────────────────────────── */

const CommentsSection = ({ questionId, user, votes }: {
  questionId: string; user?: Profile | null; votes: Vote[];
}) => {
  const [comments, setComments]   = useState<Comment[]>([]);
  const [body, setBody]           = useState('');
  const [posting, setPosting]     = useState(false);
  const [likedIds, setLikedIds]   = useState<Set<string>>(new Set());

  useEffect(() => {
    db.from('comments').select('*').eq('question_id', questionId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setComments(data || []));
  }, [questionId]);

  const postComment = async () => {
    if (!body.trim() || !user || posting) return;
    setPosting(true);
    const myVoteIndex = votes.find(v => v.user_id === user.id)?.option_index;
    const { data, error } = await db.from('comments').insert({
      question_id: questionId, user_id: user.id, username: user.username,
      body: body.trim(), vote_index: myVoteIndex, likes: 0,
    }).select().single();
    setPosting(false);
    if (!error && data) { setComments(prev => [data as Comment, ...prev]); setBody(''); }
  };

  const toggleLike = async (c: Comment) => {
    if (!user) return;
    const liked    = likedIds.has(c.id);
    const newLikes = liked ? c.likes - 1 : c.likes + 1;
    await db.from('comments').update({ likes: newLikes }).eq('id', c.id);
    setComments(prev => prev.map(x => x.id === c.id ? { ...x, likes: newLikes } : x));
    setLikedIds(prev => { const n = new Set(prev); liked ? n.delete(c.id) : n.add(c.id); return n; });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span className="section-label">DISCUSSION</span>
        <span style={{ fontSize: 12, color: '#536280' }}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {user ? (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div className="avatar avatar-sm" style={{ flexShrink: 0, marginTop: 2 }}>
            {(user.username || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Share your take…" rows={2} className="input"
              style={{ marginBottom: 8, resize: 'none' }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(); }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#536280' }}>⌘↵ to post</span>
              <button className="btn btn-gold btn-sm" onClick={postComment}
                disabled={posting || !body.trim()}>
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '14px 16px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(11,30,61,0.5)', border: '1px solid rgba(212,175,55,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#8A9BB8' }}>Sign in to join the discussion</span>
          <a href="#/auth" className="btn btn-gold btn-sm" style={{ textDecoration: 'none' }}>Sign in</a>
        </div>
      )}

      {comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#536280', fontSize: 13 }}>
          No comments yet. Be the first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map(c => {
            const liked      = likedIds.has(c.id);
            const voteColor  = c.vote_index !== undefined ? COLORS[c.vote_index % COLORS.length] : null;
            return (
              <div key={c.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div className="avatar avatar-sm" style={{ flexShrink: 0, marginTop: 2 }}>
                    {(c.username || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="font-heading" style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F5' }}>
                        {c.username}
                      </span>
                      {c.vote_index !== undefined && voteColor && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999,
                          background: voteColor + '18', border: `1px solid ${voteColor}40`,
                          color: voteColor, fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                          voted {c.vote_index + 1}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#536280', marginLeft: 'auto' }}>
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: '#C8D4E8', lineHeight: 1.55, margin: '0 0 10px',
                      fontFamily: 'Inter, sans-serif' }}>{c.body}</p>
                    <button onClick={() => toggleLike(c)} style={{
                      background: 'none', border: 'none', cursor: user ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                      borderRadius: 8, color: liked ? '#D4AF37' : '#536280',
                      fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ fontSize: 14 }}>{liked ? '❤️' : '🤍'}</span>
                      {c.likes > 0 && c.likes}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────── main page ───────────────────────── */

interface Props { id: string; user?: Profile | null; }

export const QuestionPage: React.FC<Props> = ({ id, user }) => {
  const { setPageMeta }                   = useMeta();
  const [question, setQuestion]           = useState<Question | null>(null);
  const { votes, liveVoters }             = useRealtimeVotes(id);
  const [myVote, setMyVote]               = useState<number | null>(null);
  const [myPrediction, setMyPrediction]   = useState<number | null>(null);
  const [predLocked, setPredLocked]       = useState(false);
  const [country, setCountry]             = useState('XX');
  const [voting, setVoting]               = useState(false);
  const [showReveal, setShowReveal]       = useState(false);
  const [mobileTab, setMobileTab]         = useState<'vote'|'analytics'>('vote');

  useEffect(() => {
    db.from('questions').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setQuestion(data);
        setPageMeta({
          title:       data.question_text + ' · Spitfact',
          description: data.question_text + ' — ' + (data.options as string[]).join(' vs ') + '. Vote now.',
        });
      }
    });
    const lv = getLocalVote(id);
    if (lv !== null) { setMyVote(lv); setPredLocked(true); }
    const lp = getLocalPrediction(id);
    if (lp !== null) setMyPrediction(lp);
    getCountryCode().then(setCountry);
  }, [id, setPageMeta]);

  const castVote = useCallback(async (index: number) => {
    if (myVote !== null || voting || !question) return;
    setVoting(true);
    const payload: any = { question_id: id, option_index: index, country_code: country };
    if (user?.id) { payload.user_id = user.id; payload.age_range = user.age_range; payload.gender = user.gender; }
    const { error } = await db.from('votes').insert(payload);
    setVoting(false);
    if (!error) {
      setMyVote(index); setLocalVote(id, index); setPredLocked(true);
      fireConfetti();
      setTimeout(() => { setShowReveal(true); setMobileTab('analytics'); }, 800);
    } else {
      toast.error('Vote failed — please try again.');
    }
  }, [myVote, voting, question, id, country, user]);

  const savePrediction = (index: number) => {
    if (predLocked) return;
    setMyPrediction(index); setLocalPrediction(id, index);
  };

  if (!question) return <QuestionSkeleton />;

  const total     = votes.length;
  const winnerIdx = total > 0
    ? question.options.reduce((best, _, i) =>
        votes.filter(v => v.option_index === i).length >
        votes.filter(v => v.option_index === best).length ? i : best, 0)
    : null;
  const predCorrect = predLocked && winnerIdx !== null && myPrediction === winnerIdx;

  const ageData: Record<string,number>    = {};
  const genderData: Record<string,number> = {};
  votes.forEach(v => {
    if (v.age_range) ageData[v.age_range]    = (ageData[v.age_range]    || 0) + 1;
    if (v.gender)    genderData[v.gender]     = (genderData[v.gender]    || 0) + 1;
  });

  const cat = CATEGORIES.find(c => c.id === question.category);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>

      {/* ── Mobile tab bar (hidden on desktop via inline style + CSS) ── */}
      <style>{`
        @media (max-width: 1023px) {
          .q-mobile-tab-bar { display: flex !important; }
          .q-vote-panel      { display: ${mobileTab === 'vote'      ? 'flex' : 'none'} !important; }
          .q-analytics-panel { display: ${mobileTab === 'analytics' ? 'flex' : 'none'} !important; }
        }
      `}</style>

      <div className="q-mobile-tab-bar" style={{
        display: 'none', position: 'sticky', top: 60, zIndex: 20,
        background: 'rgba(8,15,30,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
      }}>
        {(['vote', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} style={{
            flex: 1, padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600,
            color: mobileTab === tab ? '#D4AF37' : '#536280',
            borderBottom: `2px solid ${mobileTab === tab ? '#D4AF37' : 'transparent'}`,
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
          }}>
            {tab === 'vote' ? '🗳️ Vote' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* ── Split layout ── */}
      <div className="split-layout">

        {/* LEFT — vote panel */}
        <div className="split-left q-vote-panel" style={{ gap: 12, flexDirection: 'column' }}>

          {/* Header card */}
          <div className="card" style={{ padding: 20 }}>
            {cat && (
              <div className="poll-card-accent"
                style={{ background: `linear-gradient(90deg, ${cat.color}cc, ${cat.color}44, transparent)` }} />
            )}
            <a href="#/feed" style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: '#8A9BB8', textDecoration: 'none', marginBottom: 12,
              fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
              ← Feed
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {cat && (
                <span className="badge" style={{ background: cat.color + '18',
                  border: `1px solid ${cat.color}50`, color: cat.color }}>
                  {cat.label}
                </span>
              )}
              <span className="badge badge-live">
                <span className="live-dot" style={{ width: 6, height: 6 }} /> LIVE
              </span>
              {liveVoters > 1 && (
                <span className="badge badge-navy">👁 {liveVoters} viewing</span>
              )}
            </div>
            <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
              {question.question_text}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="data-value data-value-sm" style={{ color: '#D4AF37' }}>
                {total.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: '#536280' }}>
                {total === 1 ? 'vote' : 'votes'}
              </span>
            </div>
          </div>

          {/* Prediction */}
          {myVote === null && (
            <PredictionWidget question={question} myPrediction={myPrediction}
              predLocked={predLocked} onPredict={savePrediction} />
          )}

          {/* Reveal */}
          {showReveal && predLocked && myPrediction !== null && winnerIdx !== null && (
            <RevealBanner correct={predCorrect}
              predictedOpt={question.options[myPrediction]}
              winnerOpt={question.options[winnerIdx]} />
          )}

          {/* Vote buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((opt, i) => (
              <VoteButton key={i} opt={opt} idx={i}
                count={votes.filter(v => v.option_index === i).length}
                total={total} myVote={myVote}
                isWinner={winnerIdx === i} voting={voting} onVote={castVote} />
            ))}
          </div>

          {/* Share */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-subtle btn-sm" style={{ flex: 1 }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: question.question_text, url: window.location.href });
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success('Link copied to clipboard!');
                }
              }}>
              🔗 Share
            </button>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(question.question_text + ' — vote on Spitfact')}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-subtle btn-sm" style={{ textDecoration: 'none' }}>
              𝕏 Post
            </a>
          </div>
        </div>

        {/* RIGHT — analytics panel */}
        <div className="split-right q-analytics-panel" style={{ gap: 12, flexDirection: 'column' }}>
          {total === 0 ? (
            <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div className="font-heading" style={{ fontSize: 15, color: '#8A9BB8', marginBottom: 6 }}>
                No votes yet
              </div>
              <div style={{ fontSize: 13, color: '#536280' }}>
                Results appear here in real time after the first vote.
              </div>
            </div>
          ) : (
            <>
              <div className="panel" style={{ padding: '16px 16px 8px' }}>
                <div className="section-label" style={{ marginBottom: 12 }}>LIVE RESULTS</div>
                <ResultsBarChart question={question} votes={votes} />
              </div>

              <div className="panel" style={{ padding: '16px 16px 8px' }}>
                <div className="section-label" style={{ marginBottom: 4 }}>VOTE SHARE</div>
                <ResultsPieChart question={question} votes={votes} />
              </div>

              <div className="panel" style={{ padding: 16 }}>
                <CountryBreakdown votes={votes} total={total} />
              </div>

              {(Object.keys(ageData).length > 0 || Object.keys(genderData).length > 0) && (
                <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <DemoBreakdown label="👤 BY AGE"    data={ageData}    total={total} color="#D4AF37" />
                  <DemoBreakdown label="⚧ BY GENDER"  data={genderData} total={total} color="#C0C0C0" />
                </div>
              )}

              <PeopleLikeYou question={question} votes={votes} user={user} />
            </>
          )}
        </div>

        {/* BOTTOM — comments */}
        <div className="split-bottom">
          <div className="card" style={{ padding: 24 }}>
            <CommentsSection questionId={id} user={user} votes={votes} />
          </div>
        </div>

      </div>
    </div>
  );
};
