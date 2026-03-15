// js/home.js
// ─────────────────────────────────────────────────────────────────
// Home (landing) + FeedPage. htm syntax, Tailwind classes.
// New: search bar with Supabase full-text search.
// ─────────────────────────────────────────────────────────────────
import { db, COLORS, CATEGORIES, getFlag } from './db.js';
const { useState, useEffect, useCallback } = React;
const { useSearchParams }                  = ReactRouterDOM;

// ── useCountUp ────────────────────────────────────────────────────
const useCountUp = (target) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let cur = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [target]);
  return val;
};

// ── StatBlock ─────────────────────────────────────────────────────
const StatBlock = ({ value, label, grad }) => {
  const c = useCountUp(value);
  return html`
    <div class="flex-1 text-center py-5 px-2">
      <div class="text-[30px] font-black tracking-tight leading-none mb-1 count-in"
        style=${'background:' + grad + ';-webkit-background-clip:text;-webkit-text-fill-color:transparent'}>
        ${c.toLocaleString()}
      </div>
      <div class="text-[10px] font-bold uppercase tracking-widest text-slate-600">${label}</div>
    </div>
  `;
};

// ── FeaturedQuestion ──────────────────────────────────────────────
const FeaturedQuestion = ({ question, recentVotes }) => {
  if (!question) return null;
  const rv = recentVotes || 0;

  return html`
    <div class="mb-8">
      <div class="flex items-center gap-2.5 mb-3.5">
        <span class="text-sm">🔥</span>
        <span class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Trending Right Now</span>
        <div class="flex-1 h-px" style="background:linear-gradient(90deg,#1e293b,transparent)"></div>
      </div>

      <a href=${'#/q/' + question.id}
        class="g-border-hot block rounded-[24px] p-6 relative overflow-hidden no-underline text-white transition-all hover:-translate-y-0.5 hover:shadow-card">
        <!-- Glow orbs -->
        <div class="absolute -top-[60px] -right-[40px] w-[180px] h-[180px] pointer-events-none"
          style="background:radial-gradient(circle,rgba(34,211,238,0.14),transparent 70%)"></div>
        <div class="absolute -bottom-[40px] -left-[20px] w-[140px] h-[140px] pointer-events-none"
          style="background:radial-gradient(circle,rgba(129,140,248,0.12),transparent 70%)"></div>

        <div class="flex items-center gap-2 mb-3.5 relative">
          <span class="live-dot-cyan"></span>
          <span class="text-[12px] text-cyan-300 font-semibold">
            ${rv > 0 ? rv + ' votes in last 24h' : 'Hottest question right now'}
          </span>
        </div>

        <h2 class="text-[21px] font-black leading-[1.35] text-slate-100 mb-5 tracking-tight relative">
          ${question.question_text}
        </h2>

        <div class="flex flex-col gap-2 mb-5 relative">
          ${question.options.slice(0, 3).map((opt, i) => html`
            <div key=${i} class="flex items-center gap-2.5 px-4 py-2.5 rounded-[12px]"
              style=${'border:1px solid ' + COLORS[i % COLORS.length] + '40;background:' + COLORS[i % COLORS.length] + '12'}>
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black"
                style=${'background:' + COLORS[i % COLORS.length] + '25;color:' + COLORS[i % COLORS.length]}>
                ${i + 1}
              </span>
              <span class="text-[14px] font-semibold" style=${'color:' + COLORS[i % COLORS.length]}>${opt}</span>
            </div>
          `)}
          ${question.options.length > 3 && html`
            <span class="text-[12px] text-slate-600 pl-1">+${question.options.length - 3} more options</span>
          `}
        </div>

        <div class="flex items-center justify-between relative">
          <span class="text-[12px] text-slate-500">Tap to vote & see live results</span>
          <span class="text-[13px] font-bold text-cyan-400 flex items-center gap-1">Vote now <span class="text-base">→</span></span>
        </div>
      </a>
    </div>
  `;
};

// ── QuestionCard (feed) ───────────────────────────────────────────
const QuestionCard = ({ question, voteCount, recentCount }) => {
  const voted    = localStorage.getItem('voted_' + question.id) !== null;
  const trending = recentCount >= 3;
  const hot      = voteCount >= 10;
  const cat      = CATEGORIES.find(c => c.id === question.category);

  return html`
    <a href=${'#/q/' + question.id}
      class="g-border-subtle block no-underline text-white rounded-[18px] p-5 transition-all hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99]">

      <div class="flex justify-between items-start gap-2 mb-3">
        <p class="text-[16px] font-bold leading-[1.45] text-slate-100 flex-1 m-0 tracking-tight">
          ${question.question_text}
        </p>
        <div class="flex gap-1 flex-shrink-0 mt-0.5">
          ${trending && html`<span class="text-[10px] font-bold text-orange-400 bg-orange-500/12 border border-orange-500/30 rounded-full px-2 py-0.5">🔥</span>`}
          ${hot && !trending && html`<span class="text-[10px] font-bold text-amber-400 bg-amber-500/12 border border-amber-500/30 rounded-full px-2 py-0.5">HOT</span>`}
        </div>
      </div>

      <div class="flex justify-between items-center gap-2">
        <div class="flex gap-1.5 flex-wrap flex-1 min-w-0 items-center">
          ${cat && cat.id !== 'General' && html`
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style=${'border:1px solid ' + cat.color + '40;color:' + cat.color + ';background:' + cat.color + '12'}>
              ${cat.label}
            </span>
          `}
          ${question.options.slice(0, 2).map((opt, i) => html`
            <span key=${i} class="text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap font-medium"
              style=${'border:1px solid ' + COLORS[i % COLORS.length] + '40;color:' + COLORS[i % COLORS.length] + ';background:' + COLORS[i % COLORS.length] + '18'}>
              ${opt}
            </span>
          `)}
          ${question.options.length > 2 && html`
            <span class="text-[11px] text-slate-600 py-0.5">+${question.options.length - 2} more</span>
          `}
        </div>

        <div class="flex items-center gap-1.5 flex-shrink-0">
          ${voteCount > 0 && html`
            <span class="text-[12px] text-slate-600 font-medium">
              ${voteCount}${voteCount === 1 ? ' vote' : ' votes'}
            </span>
          `}
          <span class=${'text-[12px] font-bold px-2 py-0.5 rounded-full border ' + (voted ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25')}>
            ${voted ? '✓' : '→'}
          </span>
        </div>
      </div>
    </a>
  `;
};

// ── CategoryTile ──────────────────────────────────────────────────
const CategoryTile = ({ cat, count }) => html`
  <a href=${'#/feed?cat=' + cat.id}
    class="p-4 rounded-[16px] border text-left block no-underline text-white transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
    style=${'border-color:' + cat.color + '35;background:' + cat.color + '0d'}>
    <div class="text-[22px] mb-1.5">${cat.label.split(' ')[0]}</div>
    <div class="text-[13px] font-bold text-slate-200 mb-0.5 tracking-tight">${cat.label.split(' ').slice(1).join(' ')}</div>
    <div class="text-[11px] font-semibold" style=${'color:' + cat.color + '99'}>
      ${count ? count + ' question' + (count !== 1 ? 's' : '') : 'Post first'}
    </div>
  </a>
`;

// ── Pill (filter) ─────────────────────────────────────────────────
const Pill = ({ label, active, onClick, color }) => html`
  <button
    onClick=${onClick}
    class=${'flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all cursor-pointer ' + (active ? 'text-white border-transparent' : 'text-slate-500 border-border1 bg-transparent hover:border-border2 hover:text-slate-400')}
    style=${active ? 'background:' + (color || '#6366f1') + '33;border-color:' + (color || '#818cf8') + '66;color:' + (color || '#818cf8') : ''}
  >
    ${label}
  </button>
`;

// ── SearchBar ─────────────────────────────────────────────────────
const SearchBar = ({ value, onChange }) => html`
  <div class="relative mb-4">
    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none">🔍</span>
    <input
      type="search"
      placeholder="Search questions..."
      value=${value}
      onInput=${ev => onChange(ev.target.value)}
      class="w-full bg-surface border border-border1 text-slate-100 rounded-[14px] pl-10 pr-4 py-3 text-[14px] outline-none transition-all focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 placeholder:text-slate-600"
    />
  </div>
`;

// ── Home (landing) ────────────────────────────────────────────────
export const Home = ({ user }) => {
  const [stats,        setStats]        = useState({ questions: 0, votes: 0, countries: 0 });
  const [featured,     setFeatured]     = useState(null);
  const [trending,     setTrending]     = useState([]);
  const [catCounts,    setCatCounts]    = useState({});
  const [recentVotes,  setRecentVotes]  = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const since24h = new Date(Date.now() - 86400000).toISOString();

    Promise.all([
      db.from('questions').select('id', { count: 'exact', head: true }),
      db.from('votes').select('id', { count: 'exact', head: true }),
      db.from('votes').select('country_code').neq('country_code', 'XX').neq('country_code', null),
      db.from('questions').select('id,question_text,options,category').order('created_at', { ascending: false }).limit(30),
      db.from('votes').select('question_id').gte('created_at', since24h),
    ]).then(([{ count: qCount }, { count: vCount }, { data: cData }, { data: questions }, { data: recentV }]) => {
      const countries = new Set((cData || []).map(v => v.country_code)).size;
      setStats({ questions: qCount || 0, votes: vCount || 0, countries });

      const rcounts = (recentV || []).reduce((a, v) => {
        a[v.question_id] = (a[v.question_id] || 0) + 1; return a;
      }, {});

      const sorted = (questions || []).sort((a, b) => (rcounts[b.id] || 0) - (rcounts[a.id] || 0));
      setFeatured(sorted[0] || null);
      setRecentVotes(rcounts[sorted[0]?.id] || 0);
      setTrending(sorted.slice(1, 6));

      const cc = {};
      (questions || []).forEach(q => {
        const c = q.category || 'General';
        cc[c] = (cc[c] || 0) + 1;
      });
      setCatCounts(cc);
      setLoading(false);
    });
  }, []);

  if (loading) return html`
    <div class="max-w-[640px] mx-auto px-4 pt-[90px] pb-[100px]">
      ${[1, 2, 3].map(i => html`<div key=${i} class="skeleton h-24 mb-3"></div>`)}
    </div>
  `;

  return html`
    <div class="max-w-[640px] mx-auto px-4 pt-[90px] pb-[100px] page-in">

      <!-- Hero tagline -->
      <div class="text-center mb-8 mt-2">
        <h1 class="text-[32px] font-black tracking-tight leading-tight text-slate-100 mb-2">
          The World's Opinion,<br/><span style="background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Live.</span>
        </h1>
        <p class="text-slate-500 text-[15px] leading-relaxed">Vote on anything. See real-time results from around the planet.</p>
        <div class="flex gap-3 justify-center mt-5 flex-wrap">
          <a href="#/feed" class="btn-glow">📋 Browse Feed</a>
          <a href="#/post"
            class="px-6 py-3 rounded-full border border-indigo-400/35 text-indigo-400 text-[14px] font-bold transition-all hover:bg-indigo-400/10 hover:border-indigo-400 no-underline">
            + Ask a question
          </a>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="g-border rounded-[20px] flex divide-x divide-border1 mb-8 overflow-hidden">
        <${StatBlock} value=${stats.questions} label="Questions" grad="linear-gradient(135deg,#818cf8,#6366f1)" />
        <${StatBlock} value=${stats.votes}     label="Votes"     grad="linear-gradient(135deg,#22d3ee,#0ea5e9)" />
        <${StatBlock} value=${stats.countries} label="Countries" grad="linear-gradient(135deg,#e879f9,#a78bfa)" />
      </div>

      <!-- Featured (trending) -->
      <${FeaturedQuestion} question=${featured} recentVotes=${recentVotes} />

      <!-- Trending strip -->
      ${trending.length > 0 && html`
        <div class="mb-8">
          <div class="flex items-center gap-2.5 mb-3.5">
            <span class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Trending</span>
            <div class="flex-1 h-px" style="background:linear-gradient(90deg,#1e293b,transparent)"></div>
          </div>
          <div class="scroll-x">
            ${trending.map(q => html`
              <a key=${q.id} href=${'#/q/' + q.id}
                class="flex-shrink-0 w-[176px] g-border block rounded-[16px] p-4 no-underline text-white transition-all hover:-translate-y-0.5 hover:shadow-card active:scale-[0.97]">
                <div class="flex gap-1 mb-2.5 flex-wrap">
                  ${q.options.slice(0, 2).map((opt, i) => html`
                    <span key=${i} class="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[80px]"
                      style=${'border:1px solid ' + COLORS[i % COLORS.length] + '45;color:' + COLORS[i % COLORS.length] + ';background:' + COLORS[i % COLORS.length] + '15'}>
                      ${opt}
                    </span>
                  `)}
                </div>
                <p class="text-[13px] font-bold leading-[1.4] text-slate-200 mb-3.5 line-clamp-2">${q.question_text}</p>
                <span class="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full">→</span>
              </a>
            `)}
          </div>
        </div>
      `}

      <!-- Categories -->
      <div class="mb-4">
        <div class="flex items-center gap-2.5 mb-3.5">
          <span class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">Browse by Category</span>
          <div class="flex-1 h-px" style="background:linear-gradient(90deg,#1e293b,transparent)"></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${CATEGORIES.map(cat => html`
            <${CategoryTile} key=${cat.id} cat=${cat} count=${catCounts[cat.id] || 0} />
          `)}
        </div>
      </div>
    </div>
  `;
};

// ── FeedPage ──────────────────────────────────────────────────────
export const FeedPage = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initCat = searchParams.get('cat') || 'All';

  const [questions,    setQuestions]    = useState([]);
  const [voteCounts,   setVoteCounts]   = useState({});
  const [recentCounts, setRecentCounts] = useState({});
  const [activeCat,    setActiveCat]    = useState(initCat);
  const [sort,         setSort]         = useState('trending');
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searching,    setSearching]    = useState(false);

  useEffect(() => {
    const since24h = new Date(Date.now() - 86400000).toISOString();
    Promise.all([
      db.from('questions').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('votes').select('question_id'),
      db.from('votes').select('question_id').gte('created_at', since24h),
    ]).then(([{ data: qs }, { data: vs }, { data: recent }]) => {
      setQuestions(qs || []);
      setVoteCounts((vs || []).reduce((a, v) => { a[v.question_id] = (a[v.question_id] || 0) + 1; return a; }, {}));
      setRecentCounts((recent || []).reduce((a, v) => { a[v.question_id] = (a[v.question_id] || 0) + 1; return a; }, {}));
      setLoading(false);
    });
  }, []);

  // ── Debounced search ───────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await db.from('questions')
        .select('*')
        .textSearch('question_text', searchQuery.trim().split(' ').join(' & '), { config: 'english' })
        .limit(50);
      setSearchResults(data || []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const baseList = searchResults !== null ? searchResults : questions;

  const filtered = activeCat === 'All'
    ? baseList
    : baseList.filter(q => (q.category || 'General') === activeCat);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'trending') {
      const ra = recentCounts[a.id] || 0, rb = recentCounts[b.id] || 0;
      if (rb !== ra) return rb - ra;
      return (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0);
    }
    return 0; // 'new' = already sorted by created_at desc from DB
  });

  const setCat = (cat) => {
    setActiveCat(cat);
    if (cat !== 'All') setSearchParams({ cat });
    else setSearchParams({});
  };

  return html`
    <div class="min-h-screen pb-[100px] pt-[58px] page-in" style="background:#020817">

      <!-- Sticky filter bar -->
      <div class="sticky top-[58px] z-40 border-b border-border1 px-4 py-2.5"
        style="background:rgba(2,8,23,0.92);backdrop-filter:blur(16px)">

        <!-- Search -->
        <${SearchBar} value=${searchQuery} onChange=${setSearchQuery} />

        <!-- Sort + count -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex gap-1 bg-surface border border-border1 rounded-full p-0.5">
            <${Pill} label="🔥 Trending" active=${sort === 'trending'} onClick=${() => setSort('trending')} />
            <${Pill} label="✨ New"      active=${sort === 'new'}      onClick=${() => setSort('new')} />
          </div>
          ${!loading && html`
            <span class="text-[12px] text-slate-600 font-medium">
              ${sorted.length} question${sorted.length !== 1 ? 's' : ''}
            </span>
          `}
        </div>

        <!-- Category strip -->
        <div class="flex gap-1.5 overflow-x-auto scroll-x pb-1">
          <${Pill} label="🌐 All" active=${activeCat === 'All'} onClick=${() => setCat('All')} />
          ${CATEGORIES.map(cat => html`
            <${Pill} key=${cat.id} label=${cat.label} color=${cat.color}
              active=${activeCat === cat.id} onClick=${() => setCat(cat.id)} />
          `)}
        </div>
      </div>

      <!-- Feed -->
      <div class="max-w-[640px] mx-auto px-4 pt-4">
        ${loading || searching
          ? html`
            <div class="flex flex-col gap-2.5">
              ${[1, 2, 3].map(i => html`<div key=${i} class="skeleton h-24"></div>`)}
            </div>
          `
          : sorted.length === 0
          ? html`
            <div class="text-center py-16 fade-up">
              <div class="text-5xl mb-4">${searchQuery ? '🔍' : '🌍'}</div>
              <p class="text-slate-400 text-[17px] font-semibold mb-2">
                ${searchQuery ? 'No results for "' + searchQuery + '"' : activeCat === 'All' ? 'No questions yet' : 'No ' + activeCat + ' questions yet'}
              </p>
              <p class="text-slate-600 text-[15px]">
                ${searchQuery ? 'Try a different search term' : 'Be the first to post one!'}
              </p>
            </div>
          `
          : html`
            <div class="flex flex-col gap-2.5 fade-up">
              ${sorted.map(q => html`
                <${QuestionCard} key=${q.id} question=${q}
                  voteCount=${voteCounts[q.id] || 0}
                  recentCount=${recentCounts[q.id] || 0}
                />
              `)}
            </div>
          `
        }
      </div>
    </div>
  `;
};
