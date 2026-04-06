import React, { useRef } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Share2, Download, TrendingUp } from 'lucide-react';
import { useScreenshot } from '../hooks/useScreenshot';

export default function PollCard({ poll }) {
  const cardRef = useRef(null);
  const { takeScreenshot } = useScreenshot(cardRef);

  const voteData = poll.options.map(opt => ({
    name: opt,
    count: poll.votes ? poll.votes.filter(v => v.option === opt).length : 0
  }));

  const totalVotes = voteData.reduce((acc, curr) => acc + curr.count, 0);

  const handleVote = async (option) => {
    // Basic double-vote prevention (Client-side)
    if (localStorage.getItem(`voted_${poll.id}`)) return;

    try {
      const geoRes = await fetch('https://ipapi.co/json/');
      const geo = await geoRes.json();
      
      const { error } = await supabase.from('votes').insert([
        { poll_id: poll.id, option, country: geo.country_name || 'Global' }
      ]);

      if (!error) localStorage.setItem(`voted_${poll.id}`, 'true');
    } catch (e) {
      console.error("Vote failed", e);
    }
  };

  return (
    <div className="space-y-3">
      <div ref={cardRef} className="card relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-black leading-tight max-w-[80%]">{poll.question}</h3>
          <div className="bg-slate-700/50 px-2 py-1 rounded text-[10px] font-bold text-sky-400 flex items-center gap-1">
            <TrendingUp size={10} /> {totalVotes}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {poll.options.map(opt => (
            <button key={opt} onClick={() => handleVote(opt)}
              className="bg-slate-700/40 hover:bg-sky-500/20 border border-slate-600 p-3 rounded-xl text-xs font-bold transition-all active:scale-95">
              {opt}
            </button>
          ))}
        </div>

        <div className="h-32 w-full">
          <ResponsiveContainer>
            <BarChart data={voteData} layout="vertical" margin={{ left: -20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {voteData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#38bdf8' : '#818cf8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-2 px-2">
        <button onClick={takeScreenshot} className="flex-1 btn-secondary py-2 text-[10px] flex items-center justify-center gap-2">
          <Download size={12} /> Save Card
        </button>
        <button onClick={() => navigator.share?.({ title: 'Spitfact', url: window.location.href })} 
          className="flex-1 btn-secondary py-2 text-[10px] flex items-center justify-center gap-2">
          <Share2 size={12} /> Share
        </button>
      </div>
    </div>
  );
}
