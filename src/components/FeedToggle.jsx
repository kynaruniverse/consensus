export default function FeedToggle({ active, onChange }) {
  return (
    <div className="flex bg-slate-800 p-1 rounded-xl mt-6 border border-slate-700">
      <button 
        onClick={() => onChange('trending')}
        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${active === 'trending' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}>
        🔥 Trending
      </button>
      <button 
        onClick={() => onChange('recent')}
        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${active === 'recent' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}>
        🕒 Recent
      </button>
    </div>
  );
}
