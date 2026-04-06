import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Flame, Clock, Globe } from 'lucide-react';
import FeedToggle from './components/FeedToggle';
import PollCard from './components/PollCard';
import CreatePoll from './components/CreatePoll';
import { seedDatabase } from './utils/seeder';

export default function App() {
  const [view, setView] = useState('trending'); 
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- DEV SEED LOGIC ---
  useEffect(() => {
    const hasSeeded = localStorage.getItem('spitfact_seeded');
    if (!hasSeeded) {
      // To trigger: Clear your browser cache or run seedDatabase() manually once.
      // seedDatabase().then(() => localStorage.setItem('spitfact_seeded', 'true'));
    }
  }, []);
  // ----------------------

  useEffect(() => {
    fetchData();
  }, [view]);

  useEffect(() => {
    const channel = supabase
      .channel('global-votes')
      .on('postgres_changes', 
        { event: 'INSERT', table: 'votes' }, 
        () => fetchData() 
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view]);

  async function fetchData() {
    const source = view === 'trending' ? 'trending_polls' : 'polls';
    
    const { data, error } = await supabase
      .from(source)
      .select('*, votes(*)');

    if (error) {
      console.error("Fetch error:", error);
      setLoading(false);
      return;
    }

    const processedData = view === 'recent' 
      ? [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : data;

    setPolls(processedData || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-sky-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-24">
        <header className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="text-sky-400 animate-pulse" size={20} />
            <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Live Pulse</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
            SPITFACT
          </h1>
          <p className="mt-2 text-slate-400 text-sm font-medium">The world’s opinion, visualized in real-time.</p>
        </header>

        <CreatePoll onCreated={fetchData} />

        <div className="sticky top-4 z-50 mt-10">
          <FeedToggle active={view} onChange={setView} />
        </div>

        <main className="mt-8 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Syncing...</p>
            </div>
          ) : polls.length > 0 ? (
            polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))
          ) : (
            <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
              <p className="text-slate-500 font-medium">No polls found. Be the first to spark a debate.</p>
            </div>
          )}
        </main>

        <footer className="mt-20 text-center opacity-30">
          <p className="text-[9px] font-black tracking-[0.4em] uppercase text-slate-400">
            &copy; 2026 Spitfact Platform &bull; Global Consensus Engine
          </p>
        </footer>
      </div>
    </div>
  );
}
