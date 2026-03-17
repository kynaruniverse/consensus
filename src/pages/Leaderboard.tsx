import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';

interface UserScore {
  user_id: string;
  username: string;
  correct: number;
  total: number;
  accuracy: number;
}

export const LeaderboardPage = () => {
  const [scores, setScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This would need a custom SQL function in Supabase
    // For now, we'll create mock data
    const mockScores: UserScore[] = [
      { user_id: '1', username: 'crypticmind', correct: 42, total: 50, accuracy: 84 },
      { user_id: '2', username: 'worldwatcher', correct: 38, total: 47, accuracy: 81 },
      { user_id: '3', username: 'opinionmaster', correct: 35, total: 45, accuracy: 78 },
      { user_id: '4', username: 'globalguru', correct: 31, total: 42, accuracy: 74 },
      { user_id: '5', username: 'pollpro', correct: 28, total: 40, accuracy: 70 },
    ];
    setScores(mockScores);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8 pb-20">
      <h1 className="text-2xl font-black text-white mb-2">Prediction Leaderboard</h1>
      <p className="text-slate-500 text-sm mb-6">Top predictors by accuracy</p>

      <div className="bg-surface border border-border1 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 p-4 bg-subtle border-b border-border1">
          <div className="col-span-1 text-xs font-bold text-slate-500">#</div>
          <div className="col-span-6 text-xs font-bold text-slate-500">User</div>
          <div className="col-span-2 text-xs font-bold text-slate-500 text-right">Correct</div>
          <div className="col-span-3 text-xs font-bold text-slate-500 text-right">Accuracy</div>
        </div>

        {/* Rows */}
        {scores.map((score, index) => (
          <div key={score.user_id} className="grid grid-cols-12 gap-2 p-4 border-b border-border1 last:border-0">
            <div className="col-span-1">
              {index === 0 && <span className="text-yellow-400">🥇</span>}
              {index === 1 && <span className="text-slate-400">🥈</span>}
              {index === 2 && <span className="text-amber-600">🥉</span>}
              {index > 2 && <span className="text-slate-600">#{index + 1}</span>}
            </div>
            <div className="col-span-6 font-medium text-white">{score.username}</div>
            <div className="col-span-2 text-right text-slate-400">
              {score.correct}/{score.total}
            </div>
            <div className="col-span-3 text-right">
              <span className={`font-bold ${
                score.accuracy >= 80 ? 'text-green-400' :
                score.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {score.accuracy}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
        <p className="text-sm text-indigo-300">
          🎯 Predict winners before voting to improve your accuracy score. The more correct predictions, the higher you climb!
        </p>
      </div>
    </div>
  );
};
