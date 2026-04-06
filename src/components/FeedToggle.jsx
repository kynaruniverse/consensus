import React from "react";

export default function FeedToggle({ active, onChange }) {
  return (
    <div className="flex bg-slate-800/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700 shadow-2xl">
      {["trending", "recent"].map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
            active === type
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {type === "trending" ? "🔥 Trending" : "🕒 Recent"}
        </button>
      ))}
    </div>
  );
}