import React, { useState, useEffect } from 'react';
import { db, COLORS, getFlag, getLocalVote, setLocalVote, getLocalPrediction, setLocalPrediction } from '../lib/supabase';
import { useRealtimeVotes } from '../hooks/useRealtimeVotes';
import { useMeta } from '../hooks/useMeta';
import type { Question } from '../types';

interface Props {
  id: string;
  user?: any;
}

export const QuestionPage: React.FC<Props> = ({ id, user }) => {
  const { setPageMeta } = useMeta();
  const [question, setQuestion] = useState<Question | null>(null);
  const { votes, liveVoters } = useRealtimeVotes(id);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [myPrediction, setMyPrediction] = useState<number | null>(null);
  const [predLocked, setPredLocked] = useState(false);
  const [country, setCountry] = useState('XX');
  const [voting, setVoting] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    db.from('questions').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setQuestion(data);
        setPageMeta({
          title: data.question_text + ' · Spitfact',
          description: data.question_text + ' — ' + data.options.join(' vs ') + '. Vote now and see live results.'
        });
      }
    });

    const localVote = getLocalVote(id);
    if (localVote !== null) {
      setMyVote(localVote);
      setPredLocked(true);
    }

    const localPred = getLocalPrediction(id);
    if (localPred !== null) {
      setMyPrediction(localPred);
    }

    getCountryCode().then(setCountry);
  }, [id, setPageMeta]);

  const castVote = async (index: number) => {
    if (myVote !== null || voting || !question) return;
    setVoting(true);

    const payload: any = {
      question_id: id,
      option_index: index,
      country_code: country,
    };

    if (user?.id) {
      payload.user_id = user.id;
      payload.age_range = user.age_range;
      payload.gender = user.gender;
    }

    const { error } = await db.from('votes').insert(payload);
    setVoting(false);

    if (!error) {
      setMyVote(index);
      setLocalVote(id, index);
      setPredLocked(true);
      setTimeout(() => setShowReveal(true), 800);
    }
  };

  const savePrediction = (index: number) => {
    if (predLocked) return;
    setMyPrediction(index);
    setLocalPrediction(id, index);
  };

  if (!question) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  const total = votes.length;
  const winnerIdx = total > 0
    ? question.options.reduce((best, _, i) => 
        votes.filter(v => v.option_index === i).length > votes.filter(v => v.option_index === best).length ? i : best, 0)
    : null;
  const predCorrect = predLocked && winnerIdx !== null && myPrediction === winnerIdx;

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-4 pb-20">
      <a href="#/" className="inline-flex items-center gap-1 text-slate-600 text-sm mb-4">
        ← All questions
      </a>

      <h1 className="text-2xl font-black text-white mb-3">{question.question_text}</h1>

      {/* Live indicators */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="live-dot"></span>
          <span className="text-sm text-slate-500">{total} votes</span>
        </div>
        {liveVoters > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs text-cyan-400">{liveVoters} viewing now</span>
          </div>
        )}
      </div>

      {/* Prediction */}
      {!myVote && (
        <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔮</span>
            <div>
              <div className="text-sm font-semibold text-indigo-300">
                {myPrediction !== null ? 'Prediction locked!' : 'Predict the winner'}
              </div>
            </div>
          </div>

          {myPrediction === null ? (
            <div className="flex flex-col gap-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => savePrediction(i)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border1 hover:border-indigo-500/50 transition">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: COLORS[i % COLORS.length] + '30', color: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-300">{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl border" style={{ borderColor: COLORS[myPrediction % COLORS.length] + '40' }}>
              <span className="text-sm font-semibold" style={{ color: COLORS[myPrediction % COLORS.length] }}>
                You predicted: {question.options[myPrediction]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reveal */}
      {showReveal && predLocked && myPrediction !== null && winnerIdx !== null && (
        <div className={`mb-6 p-4 rounded-xl text-center ${
          predCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="text-3xl mb-2">{predCorrect ? '🎯' : '😬'}</div>
          <div className={`text-lg font-bold mb-1 ${predCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {predCorrect ? 'Nailed it!' : 'Not quite!'}
          </div>
          <div className="text-xs text-slate-500">
            {predCorrect
              ? `Your prediction was right — ${question.options[winnerIdx]} is winning!`
              : `You predicted ${question.options[myPrediction]}, but ${question.options[winnerIdx]} is leading.`}
          </div>
        </div>
      )}

      {/* Vote buttons */}
      <div className="flex flex-col gap-3 mb-8">
        {question.options.map((opt, i) => {
          const count = votes.filter(v => v.option_index === i).length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isMe = myVote === i;
          const isWin = winnerIdx === i && total > 0;

          return (
            <button
              key={i}
              onClick={() => castVote(i)}
              disabled={myVote !== null || voting}
              className={`relative overflow-hidden text-left p-4 rounded-xl border transition ${
                isMe ? 'border-indigo-500 bg-indigo-500/10' : 'border-border1 bg-surface hover:border-indigo-500/50'
              }`}>
              {myVote !== null && (
                <div
                  className="absolute left-0 top-0 h-full transition-all duration-1000 ease-out"
                  style={{
                    width: pct + '%',
                    background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}30, ${COLORS[i % COLORS.length]}10)`
                  }}
                />
              )}
              <div className="relative flex justify-between items-center">
                <span className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-medium text-slate-200">{opt}</span>
                  {isMe && <span className="text-xs text-indigo-400">✓ Your vote</span>}
                  {isWin && <span className="text-sm">🏆</span>}
                </span>
                {myVote !== null && (
                  <span className="text-lg font-black" style={{ color: COLORS[i % COLORS.length] }}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Results with demographics */}
      {total > 0 && (
        <div className="space-y-4">
          <div className="bg-surface border border-border1 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Live Results</h3>
            {question.options.map((opt, i) => {
              const count = votes.filter(v => v.option_index === i).length;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={i} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{opt}</span>
                    <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
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

          {/* Country breakdown */}
          <div className="bg-surface border border-border1 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">🌍 By Country</h3>
            {Object.entries(
              votes.reduce((acc: Record<string, number>, v) => {
                const c = v.country_code || 'XX';
                acc[c] = (acc[c] || 0) + 1;
                return acc;
              }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([code, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={code} className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getFlag(code)}</span>
                  <span className="text-xs text-slate-400 w-8">{code}</span>
                  <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: pct + '%' }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
