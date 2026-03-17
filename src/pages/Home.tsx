import React, { useState, useEffect } from 'react';
import { db, CATEGORIES } from '../lib/supabase';
import { navigate } from '../lib/router';

export const HomePage = () => {
  const [stats, setStats] = useState({ questions: 0, votes: 0, countries: 0 });
  const [featured, setFeatured] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.from('questions').select('id', { count: 'exact', head: true }),
      db.from('votes').select('id', { count: 'exact', head: true }),
      db.from('votes').select('country_code').neq('country_code', 'XX').neq('country_code', null),
      db.from('questions').select('*').order('created_at', { ascending: false }).limit(1),
    ]).then(([
      { count: qCount },
      { count: vCount },
      { data: cData },
      { data: questions }
    ]) => {
      const countries = new Set((cData || []).map(v => v.country_code)).size;
      setStats({ 
        questions: qCount || 0, 
        votes: vCount || 0, 
        countries 
      });
      setFeatured(questions?.[0] || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-[640px] mx-auto px-4 pt-8 pb-24">
        <div className="skeleton h-32 w-full mb-6"></div>
        <div className="skeleton h-24 w-full mb-4"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-4 pb-24 md:pb-12">
      {/* Hero Section */}
      <div className="mb-8 fade-in">
        <h1 className="text-3xl md:text-4xl font-black mb-3">
          <span className="text-text-primary">The World's</span>
          <br />
          <span className="text-bronze">Opinion, Live</span>
        </h1>
        <p className="text-text-secondary text-base leading-relaxed">
          Vote on anything. See real-time results from around the planet. No bias, just data.
        </p>
      </div>

      {/* Stats Cards - USING METAL-CARD CLASS */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="metal-card p-4 text-center slide-in">
          <div className="text-2xl mb-1 text-bronze">❓</div>
          <div className="text-2xl font-bold text-text-primary">{stats.questions}</div>
          <div className="text-xs text-text-tertiary mt-1">Questions</div>
        </div>
        <div className="metal-card p-4 text-center slide-in" style={{ animationDelay: '100ms' }}>
          <div className="text-2xl mb-1 text-gold">🗳️</div>
          <div className="text-2xl font-bold text-text-primary">{stats.votes}</div>
          <div className="text-xs text-text-tertiary mt-1">Votes</div>
        </div>
        <div className="metal-card p-4 text-center slide-in" style={{ animationDelay: '200ms' }}>
          <div className="text-2xl mb-1 text-silver">🌍</div>
          <div className="text-2xl font-bold text-text-primary">{stats.countries}</div>
          <div className="text-xs text-text-tertiary mt-1">Countries</div>
        </div>
      </div>

      {/* Featured Question - USING METAL-CARD CLASS */}
      {featured && (
        <div className="mb-8 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="live-dot"></span>
            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
              HOTTEST RIGHT NOW
            </span>
          </div>
          
          <div 
            onClick={() => navigate(`/q/${featured.id}`)}
            className="metal-card p-6 cursor-pointer group relative overflow-hidden"
          >
            <div className="card-gradient-header" />
            
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {featured.question_text}
            </h2>
            
            <div className="flex gap-2 mb-4">
              {featured.options.slice(0, 2).map((opt: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full bg-bg-metal text-text-secondary border border-border-metal"
                >
                  {opt}
                </span>
              ))}
              {featured.options.length > 2 && (
                <span className="text-xs px-3 py-1.5 rounded-full bg-bg-metal text-text-tertiary border border-border-metal">
                  +{featured.options.length - 2}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-bronze font-medium group-hover:translate-x-1 transition-transform">
                Vote now →
              </span>
              <span className="text-xs text-text-tertiary">
                {featured.options.length} options
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gold text-lg">📌</span>
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
            BROWSE BY CATEGORY
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.slice(0, 6).map((cat, idx) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/feed?cat=${cat.id}`)}
              className="metal-card p-4 cursor-pointer group slide-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div 
                className="card-gradient-header"
                style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}dd, ${cat.color}99)` }}
              />
              <div className="text-2xl mb-2">{cat.label.split(' ')[0]}</div>
              <div className="font-medium text-text-primary text-sm mb-1">
                {cat.label.split(' ').slice(1).join(' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
