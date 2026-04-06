import React, { useRef } from 'react';
import { useScreenshot } from '../hooks/useScreenshot';
import ShareButton from './ShareButton';
// ... previous imports

export default function PollCard({ poll }) {
  const cardRef = useRef(null);
  const { takeScreenshot } = useScreenshot(cardRef);

  // Grouping countries for the breakdown
  const countryCounts = poll.votes.reduce((acc, v) => {
    acc[v.country] = (acc[v.country] || 0) + 1;
    return acc;
  }, {});
  
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="relative">
      {/* Wrapper for screenshot - padding added for cleaner capture */}
      <div ref={cardRef} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-bold mb-4">{poll.question}</h3>
        
        {/* Chart Component from Phase 1 */}
        {/* ... */}

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Global Breakdown</p>
          <div className="flex gap-4">
            {topCountries.map(([name, count]) => (
              <div key={name} className="text-xs">
                <span className="text-slate-400">{name}:</span> <span className="font-mono text-sky-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Share Actions - outside the screenshot ref */}
      <ShareButton onCapture={takeScreenshot} question={poll.question} />
    </div>
  );
}
