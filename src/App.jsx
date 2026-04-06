import React, { useState, useEffect } from 'react';
import FeedToggle from './components/FeedToggle';
// ... other imports

export default function App() {
  const [view, setView] = useState('trending'); // 'trending' or 'recent'
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    fetchData();
  }, [view]);

  async function fetchData() {
    const table = view === 'trending' ? 'trending_polls' : 'polls';
    const { data } = await supabase
      .from(table)
      .select('*, votes(*)');
    
    // If 'recent', sort manually by date
    const sortedData = view === 'recent' 
      ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : data;

    setPolls(sortedData || []);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <header className="text-center py-6">
        <h1 className="text-4xl font-black text-sky-400">SPITFACT</h1>
      </header>

      <CreatePoll onCreated={fetchData} />
      
      <FeedToggle active={view} onChange={setView} />

      <div className="mt-6 space-y-8 pb-20">
        {polls.length > 0 ? (
          polls.map(poll => <PollCard key={poll.id} poll={poll} />)
        ) : (
          <p className="text-center text-slate-500">Scanning the globe for opinions...</p>
        )}
      </div>
    </div>
  );
}
