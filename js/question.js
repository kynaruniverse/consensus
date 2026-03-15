// js/question.js
// ─────────────────────────────────────────────────────────────────
// Question detail: voting, live results, demographic breakdown,
// share card, country filter, "People Like You".
// Fixes: getCountryCode helper (cached + timeout), toast errors,
//        optimistic vote UI, live bar animation on realtime updates.
// ─────────────────────────────────────────────────────────────────
import { db, COLORS, CATEGORIES, getFlag, getCountryCode, getLocalVote, setLocalVote, getLocalPrediction, setLocalPrediction } from './db.js';
import { setPageMeta } from './app.js';
import { createNotification } from './notifications.js';
import { useToast } from './app.js';
const { useState, useEffect, useRef } = React;
const { useNavigate } = ReactRouterDOM;

// ── Canvas helpers ────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' '); let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line, x, y); line = words[i] + ' '; y += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}

// ── ResultBars (animated) ─────────────────────────────────────────
const ResultBars = ({ options, votes }) => {
  const total = votes.length;
  return html`
    <div class="flex flex-col gap-4">
      ${options.map((opt, i) => {
        const count = votes.filter(v => v.option_index === i).length;
        const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
        const isWin = total > 0 && count === Math.max(...options.map((_, j) => votes.filter(v => v.option_index === j).length)) && count > 0;
        const col   = COLORS[i % COLORS.length];
        return html`
          <div key=${i}>
            <div class="flex justify-between items-baseline mb-1.5">
              <span class="text-[14px] font-semibold text-slate-200 flex-1 pr-3 leading-snug">${opt}</span>
              <span class="text-[18px] font-black flex-shrink-0" style=${'color:' + col}>
                ${total > 0 ? pct + '%' : '—'}
              </span>
            </div>
            <div class="bg-subtle rounded-full h-[9px] overflow-hidden mb-1">
              <div class="bar-fill h-full rounded-full" style=${'background:linear-gradient(90deg,' + col + ',' + col + '99);width:' + pct + '%;box-shadow:0 0 8px ' + col + '60'}></div>
            </div>
            <span class="text-[12px] text-slate-500">
              ${count} vote${count !== 1 ? 's' : ''}${isWin && total > 0 ? ' 🏆' : ''}
            </span>
          </div>
        `;
      })}
    </div>
  `;
};

// ── DemoCompare ───────────────────────────────────────────────────
const DemoCompare = ({ votes, options }) => {
  const [tab, setTab] = useState('gender');
  const withGender = votes.filter(v => v.gender);
  const withAge    = votes.filter(v => v.age_range);
  if (withGender.length < 5 && withAge.length < 5) return null;

  const groups = tab === 'gender'
    ? [...new Set(withGender.map(v => v.gender))].filter(Boolean)
    : [...new Set(withAge.map(v => v.age_range))].sort();

  const groupVotes = g => tab === 'gender'
    ? withGender.filter(v => v.gender === g)
    : withAge.filter(v => v.age_range === g);

  return html`
    <div class="mt-5 pt-5 border-t border-border1">
      <div class="flex gap-2 mb-4">
        ${withGender.length >= 5 && html`
          <button onClick=${() => setTab('gender')}
            class=${'px-3.5 py-1.5 rounded-full border text-[12px] font-bold cursor-pointer transition-all ' + (tab === 'gender' ? 'border-indigo-400/55 bg-indigo-400/15 text-indigo-400' : 'border-border1 bg-transparent text-slate-500')}>
            👤 Gender
          </button>
        `}
        ${withAge.length >= 5 && html`
          <button onClick=${() => setTab('age')}
            class=${'px-3.5 py-1.5 rounded-full border text-[12px] font-bold cursor-pointer transition-all ' + (tab === 'age' ? 'border-indigo-400/55 bg-indigo-400/15 text-indigo-400' : 'border-border1 bg-transparent text-slate-500')}>
            📊 Age Group
          </button>
        `}
      </div>

      <div class="overflow-x-auto">
        <div class="grid gap-x-3 min-w-[280px]"
          style=${'grid-template-columns: 120px ' + groups.map(() => '1fr').join(' ')}>
          <!-- Header -->
          <div></div>
          ${groups.map(g => html`
            <div key=${g} class="text-[12px] font-bold text-slate-400 text-center pb-2.5 border-b border-border1">${g}</div>
          `)}
          <!-- Rows -->
          ${options.map((opt, i) => {
            const col = COLORS[i % COLORS.length];
            return [
              html`
                <div key=${'lbl' + i} class="text-[12px] font-semibold pt-3 pr-2 leading-snug flex items-center gap-1.5" style=${'color:' + col}>
                  <span class="w-2 h-2 rounded-full flex-shrink-0 inline-block" style=${'background:' + col}></span>
                  ${opt.length > 16 ? opt.slice(0, 15) + '…' : opt}
                </div>
              `,
              ...groups.map(g => {
                const gv    = groupVotes(g);
                const count = gv.filter(v => v.option_index === i).length;
                const pct   = gv.length > 0 ? Math.round((count / gv.length) * 100) : 0;
                const isWin = gv.length > 0 && count === Math.max(...options.map((_, j) => gv.filter(v => v.option_index === j).length)) && count > 0;
                return html`
                  <div key=${'bar' + i + g} class="pt-3 flex flex-col items-center gap-1">
                    <div class="w-full bg-subtle rounded-full overflow-hidden h-[7px]">
                      <div class="bar-fill h-full rounded-full" style=${'background:' + col + ';width:' + pct + '%;box-shadow:' + (isWin ? '0 0 6px ' + col : 'none')}></div>
                    </div>
                    <span class=${'text-[12px] font-' + (isWin ? '900' : '600')} style=${'color:' + (isWin ? col : '#475569')}>
                      ${gv.length > 0 ? pct + '%' : '—'}
                    </span>
                  </div>
                `;
              }),
            ];
          }).flat()}
        </div>
      </div>
    </div>
  `;
};

// ── PeoplelikeYou ─────────────────────────────────────────────────
const PeoplelikeYou = ({ user, votes, myVote, options }) => {
  if (!user?.age_range && !user?.gender) return null;
  if (myVote === null) return null;

  const lines = [];

  if (user.age_range) {
    const ageVotes = votes.filter(v => v.age_range === user.age_range);
    if (ageVotes.length >= 3) {
      const count = ageVotes.filter(v => v.option_index === myVote).length;
      const pct   = Math.round((count / ageVotes.length) * 100);
      lines.push({ icon: pct >= 50 ? '🎯' : '🤔', text: pct + '% of ' + user.age_range + 's also chose "' + options[myVote] + '"', agree: pct >= 50 });
    }
  }
  if (user.gender) {
    const genVotes = votes.filter(v => v.gender === user.gender);
    if (genVotes.length >= 3) {
      const count = genVotes.filter(v => v.option_index === myVote).length;
      const pct   = Math.round((count / genVotes.length) * 100);
      lines.push({ icon: pct >= 50 ? '✊' : '👀', text: pct + '% of ' + user.gender + ' voters also chose "' + options[myVote] + '"', agree: pct >= 50 });
    }
  }
  if (!lines.length) return null;

  return html`
    <div class="mt-5 pt-5 border-t border-border1">
      <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">🧬 People like you</p>
      <div class="flex flex-col gap-2">
        ${lines.map((l, i) => html`
          <div key=${i} class=${'flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] border ' + (l.agree ? 'border-emerald-500/20 bg-emerald-500/6' : 'border-indigo-500/20 bg-indigo-500/6')}>
            <span class="text-xl flex-shrink-0">${l.icon}</span>
            <span class="text-[13px] text-slate-400 leading-snug">${l.text}</span>
          </div>
        `)}
      </div>
    </div>
  `;
};

// ── QuestionPage ──────────────────────────────────────────────────
export const QuestionPage = ({ id, user }) => {
  const [question,      setQuestion]      = useState(null);
  const [votes,         setVotes]         = useState([]);
  const [myVote,        setMyVote]        = useState(null);
  const [myPrediction,  setMyPrediction]  = useState(null);
  const [predLocked,    setPredLocked]    = useState(false);
  const [country,       setCountry]       = useState('XX');
  const [voting,        setVoting]        = useState(false);
  const [newVote,       setNewVote]       = useState(false);
  const [showReveal,    setShowReveal]    = useState(false);
  const [countryFilter, setCountryFilter] = useState(null);
  const [msg,           setMsg]           = useState('');
  const toast   = useToast();
  const navigate = useNavigate();

  // ── Load local state ──────────────────────────────────────────
  useEffect(() => {
    const pr = getLocalPrediction(id);
    if (pr !== null) { setMyPrediction(pr); setPredLocked(true); }

    const local = getLocalVote(id);
    if (local !== null) {
      setMyVote(local);
    } else if (user?.id) {
      db.from('votes').select('option_index')
        .eq('question_id', id).eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setMyVote(data.option_index);
            setLocalVote(id, data.option_index);
            setPredLocked(true);
          }
        });
    }
  }, [id, user?.id]);

  // ── Get country (cached, with timeout) ────────────────────────
  useEffect(() => {
    getCountryCode().then(code => setCountry(code));
  }, []);

  // ── Load question + votes ─────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    db.from('questions').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (!data) { navigate('/'); return; }
        setQuestion(data);
        setPageMeta({
          title: data.question_text + ' — Spitfact',
          description: 'Vote now: ' + data.options.join(' vs '),
          url: 'https://spitfact.netlify.app/#/q/' + id,
        });
      });

    db.from('votes').select('option_index,country_code,gender,age_range')
      .eq('question_id', id)
      .then(({ data }) => setVotes(data || []));

    // Realtime — live vote animation
    const ch = db.channel('votes:' + id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'votes',
        filter: 'question_id=eq.' + id,
      }, (payload) => {
        setVotes(prev => [...prev, payload.new]);
        setNewVote(true);
        setTimeout(() => setNewVote(false), 800);
      })
      .subscribe();

    return () => db.removeChannel(ch);
  }, [id]);

  // ── Cast vote ─────────────────────────────────────────────────
  const castVote = async (optionIndex) => {
    if (voting || myVote !== null) return;
    setVoting(true);

    // Optimistic update
    const optimisticVote = {
      option_index: optionIndex,
      country_code: country,
      gender:       user?.gender    || null,
      age_range:    user?.age_range || null,
    };
    setVotes(prev => [...prev, optimisticVote]);
    setMyVote(optionIndex);
    setLocalVote(id, optionIndex);
    setPredLocked(true);

    const payload = {
      question_id:  id,
      option_index: optionIndex,
      country_code: country,
      gender:       user?.gender    || null,
      age_range:    user?.age_range || null,
    };
    if (user?.id) payload.user_id = user.id;

    const { error } = await db.from('votes').insert(payload);
    setVoting(false);

    if (error) {
      // Rollback optimistic update
      setVotes(prev => prev.filter(v => v !== optimisticVote));
      setMyVote(null);
      localStorage.removeItem('voted_' + id);
      toast.error('Vote failed — please try again.');
      return;
    }

    // Notify question author
    if (question?.created_by && question.created_by !== user?.id) {
      createNotification({
        userId:       question.created_by,
        questionId:   id,
        questionText: question.question_text,
        totalVotes:   votes.length + 1,
      });
    }
  };

  // ── Set prediction ────────────────────────────────────────────
  const setPrediction = (i) => {
    if (predLocked) return;
    setMyPrediction(i);
    setLocalPrediction(id, i);
  };

  // ── Share card (canvas) ───────────────────────────────────────
  const generateShareCard = () => {
    if (!question) return;
    const total = votes.length;
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 630;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#020817';
    ctx.fillRect(0, 0, 1200, 630);

    ctx.fillStyle = '#6366f122';
    roundRect(ctx, 40, 40, 1120, 550, 32);
    ctx.fill();

    ctx.font = 'bold 32px -apple-system, sans-serif';
    ctx.fillStyle = '#818cf8';
    ctx.fillText('Spitfact', 80, 100);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('fact', 80 + ctx.measureText('Spit').width, 100);

    ctx.font = 'bold 42px -apple-system, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    wrapText(ctx, question.question_text, 80, 170, 1040, 56);

    question.options.forEach((opt, i) => {
      const count = votes.filter(v => v.option_index === i).length;
      const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
      const y     = 280 + i * 72;
      ctx.fillStyle = COLORS[i % COLORS.length] + '22';
      roundRect(ctx, 80, y, 1040, 56, 12); ctx.fill();
      ctx.fillStyle = COLORS[i % COLORS.length];
      roundRect(ctx, 80, y, Math.max(1040 * pct / 100, 8), 56, 12); ctx.fill();
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 22px -apple-system, sans-serif';
      ctx.fillText(opt + '  ' + pct + '%', 100, y + 36);
    });

    ctx.fillStyle = '#475569';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.fillText(total + ' votes • spitfact.netlify.app', 80, 590);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'spitfact-result.png'; a.click();
      URL.revokeObjectURL(url);
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success('Link copied!'))
      .catch(() => toast.error('Could not copy link'));
  };

  // ── Derived state ──────────────────────────────────────────────
  if (!question) return html`
    <div class="max-w-[640px] mx-auto px-4 pt-[90px] pb-[100px]">
      ${[1, 2, 3].map(i => html`<div key=${i} class="skeleton h-20 mb-3"></div>`)}
    </div>
  `;

  const hasVoted    = myVote !== null;
  const total       = votes.length;
  const winnerIdx   = total > 0
    ? question.options.reduce((wi, _, i) => votes.filter(v => v.option_index === i).length > votes.filter(v => v.option_index === wi).length ? i : wi, 0)
    : -1;
  const displayVotes   = countryFilter ? votes.filter(v => v.country_code === countryFilter) : votes;
  const displayTotal   = displayVotes.length;
  const topCountries   = Object.entries(
    votes.filter(v => v.country_code && v.country_code !== 'XX').reduce((a, v) => {
      a[v.country_code] = (a[v.country_code] || 0) + 1; return a;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const cat = CATEGORIES.find(c => c.id === question.category);

  return html`
    <div class="max-w-[640px] mx-auto px-4 pt-[90px] pb-[100px] page-in">

      <!-- Question header -->
      <div class="mb-5">
        ${cat && html`
          <span class="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mb-3"
            style=${'border:1px solid ' + cat.color + '40;color:' + cat.color + ';background:' + cat.color + '12'}>
            ${cat.label}
          </span>
        `}
        <h1 class="text-[24px] font-black leading-tight tracking-tight text-slate-100">
          ${question.question_text}
        </h1>
      </div>

      <!-- Prediction (pre-vote) -->
      ${!hasVoted && !predLocked && html`
        <div class="g-border rounded-[18px] p-5 mb-4">
          <p class="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">🎯 Predict the winner first</p>
          <div class="flex flex-col gap-2">
            ${question.options.map((opt, i) => html`
              <button key=${i}
                onClick=${() => setPrediction(i)}
                class=${'w-full text-left px-4 py-3 rounded-[12px] border text-[14px] font-semibold transition-all cursor-pointer ' + (myPrediction === i ? 'text-indigo-300 border-indigo-500/55 bg-indigo-500/12' : 'text-slate-400 border-border1 bg-transparent hover:border-border2')}>
                ${opt}
              </button>
            `)}
          </div>
        </div>
      `}

      <!-- Vote buttons -->
      <div class="flex flex-col gap-2.5 mb-8">
        ${question.options.map((opt, i) => {
          const count = votes.filter(v => v.option_index === i).length;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          const isMe  = myVote === i;
          const isWin = winnerIdx === i && total > 0;
          const col   = COLORS[i % COLORS.length];

          return html`
            <button key=${i}
              onClick=${() => castVote(i)}
              disabled=${hasVoted || voting}
              class=${'relative overflow-hidden text-left px-4 py-3.5 rounded-[16px] border w-full font-semibold text-[15px] transition-all block ' + (isMe ? 'bg-[#1a1f3a]' : 'bg-surface') + ' ' + (!hasVoted && !voting ? 'hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]' : 'cursor-default')}
              style=${'border-color:' + (isMe ? '#6366f1' : '#1a2540')}>

              <!-- Progress fill -->
              ${hasVoted && html`
                <div class="absolute left-0 top-0 h-full rounded-[16px] bar-fill pointer-events-none"
                  style=${'background:linear-gradient(90deg,' + col + '30,' + col + '10);width:' + pct + '%'}></div>
              `}

              <div class="relative flex justify-between items-center gap-2">
                <span class="flex items-center gap-2 flex-1">
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style=${'background:' + col + ';box-shadow:0 0 6px ' + col + '60'}></span>
                  <span class=${'font-' + (isMe ? '700' : '600') + ' ' + (isMe ? 'text-indigo-100' : 'text-slate-200')}>${opt}</span>
                  ${isMe && html`<span class="text-[12px] text-indigo-400 font-bold">✓ Your vote</span>`}
                  ${isWin && html`<span class="text-sm">🏆</span>`}
                </span>
                ${hasVoted && html`
                  <span class="text-[17px] font-black flex-shrink-0 min-w-[44px] text-right" style=${'color:' + col}>${pct}%</span>
                `}
              </div>
            </button>
          `;
        })}
      </div>

      <!-- Results card -->
      <div class="g-border rounded-[20px] p-6 mb-3">

        <!-- Header -->
        <div class="flex justify-between items-start mb-5">
          <div>
            <h2 class="text-[17px] font-black text-slate-100 mb-0.5">Live Results</h2>
            <p class="text-slate-500 text-[13px] leading-snug max-w-[320px]">${question.question_text}</p>
          </div>
          <div class="text-right flex-shrink-0 ml-3">
            <div class="flex items-center gap-1.5 justify-end mb-1">
              <span class=${'live-dot' + (newVote ? '' : '')}></span>
              <span class="text-[11px] text-slate-500 font-semibold tracking-wider">LIVE</span>
            </div>
            <div class=${'text-[30px] font-black leading-none text-slate-100 transition-all ' + (newVote ? 'text-indigo-300' : '')}>
              ${countryFilter ? displayTotal : total}
            </div>
            <div class="text-[11px] text-slate-600 mt-0.5">
              ${countryFilter ? 'votes in ' + countryFilter : 'total votes'}
            </div>
          </div>
        </div>

        ${total === 0
          ? html`
            <div class="text-center py-9">
              <div class="text-4xl mb-2.5">🗳️</div>
              <p class="text-[15px] text-slate-500">No votes yet — be the first!</p>
            </div>
          `
          : html`
            <${ResultBars} options=${question.options} votes=${displayVotes} />

            <!-- Country filter -->
            ${topCountries.length > 0 && html`
              <div class="mt-6 pt-5 border-t border-border1">
                <div class="flex justify-between items-center mb-3.5">
                  <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0">🌍 By Country</p>
                  ${countryFilter && html`
                    <button onClick=${() => setCountryFilter(null)}
                      class="bg-transparent border-none text-indigo-400 text-[12px] font-semibold cursor-pointer hover:text-indigo-300">
                      ✕ Show all
                    </button>
                  `}
                </div>
                <div class="flex flex-wrap gap-2 mb-4">
                  ${topCountries.map(([code, count]) => {
                    const pct    = Math.round((count / total) * 100);
                    const active = countryFilter === code;
                    return html`
                      <button key=${code}
                        onClick=${() => setCountryFilter(active ? null : code)}
                        class=${'flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-[12px] font-semibold ' + (active ? 'border-indigo-400/55 bg-indigo-400/15 text-indigo-400' : 'border-border1 bg-transparent text-slate-400 hover:border-border2')}>
                        <span class="text-base">${getFlag(code)}</span>
                        <span>${code}</span>
                        <span class=${'text-[11px] ' + (active ? 'text-indigo-400' : 'text-slate-500')}>${pct}%</span>
                      </button>
                    `;
                  })}
                </div>
                ${countryFilter && html`
                  <p class="text-[13px] text-slate-500 italic mb-2">
                    Showing ${displayTotal} vote${displayTotal !== 1 ? 's' : ''} from ${countryFilter} only
                  </p>
                `}
              </div>
            `}

            <${DemoCompare} votes=${votes} options=${question.options} />
            <${PeoplelikeYou} user=${user} votes=${votes} myVote=${myVote} options=${question.options} />
          `
        }

        <!-- Footer -->
        <div class="mt-5 pt-4 border-t border-border1 flex justify-between items-center">
          <span class="text-[13px] font-black tracking-tight">
            <span style="color:#818cf8">Spit</span><span class="text-slate-400">fact</span>
          </span>
          <span class="text-[11px] text-slate-600">${new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <!-- Share buttons -->
      <div class="flex flex-col gap-2.5">
        <button
          class="w-full py-3.5 rounded-[14px] text-white font-bold text-[15px] transition-opacity hover:opacity-90"
          style="background:linear-gradient(135deg,#059669,#047857);box-shadow:0 4px 20px rgba(5,150,105,0.35)"
          onClick=${generateShareCard}>
          📸 Save shareable image card
        </button>
        <button
          class="w-full py-3.5 rounded-[14px] border border-border2 text-slate-500 font-semibold text-[14px] bg-transparent transition-colors hover:border-indigo-500 hover:text-slate-100"
          onClick=${copyLink}>
          🔗 Copy link to share
        </button>
      </div>

      ${!user && html`
        <p class="text-center mt-3 text-[13px] text-slate-500">
          Sign in to unlock${' '}
          <a href="#/auth" class="text-indigo-400 font-semibold hover:text-indigo-300">gender & age breakdowns</a>
          ${' '}on results.
        </p>
      `}
    </div>
  `;
};
