// js/home.js
import { e, div, span, p, db, COLORS, CATEGORIES } from './db.js';
const { useState, useEffect } = React;

// ── useCountUp ────────────────────────────────────────────────
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

// ── StatBlock ─────────────────────────────────────────────────
const StatBlock = ({ value, label, grad }) => {
  const c = useCountUp(value);
  return div({ className:'stat-block' },
    div({ className:'stat-num count-in', style:{
      background: grad,
      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
    }}, c.toLocaleString()),
    div({ className:'stat-lbl' }, label)
  );
};

// ── FeaturedQuestion ──────────────────────────────────────────
const FeaturedQuestion = ({ question, recentVotes }) => {
  if (!question) return null;
  const rv = recentVotes || 0;

  return div({ style:{marginBottom:32} },
    div({ className:'s-label' },
      span({ style:{color:'#f97316', fontSize:14} }, '🔥'),
      span(null, 'Trending Right Now')
    ),
    e('a', { href:'#/q/'+question.id, className:'g-card-hot', style:{display:'block', padding:24, position:'relative', overflow:'hidden', textDecoration:'none', color:'white'} },
      div({ style:{position:'absolute',top:-60,right:-40,width:180,height:180,
        background:'radial-gradient(circle,rgba(34,211,238,0.14),transparent 70%)',pointerEvents:'none'} }),
      div({ style:{position:'absolute',bottom:-40,left:-20,width:140,height:140,
        background:'radial-gradient(circle,rgba(129,140,248,0.12),transparent 70%)',pointerEvents:'none'} }),

      div({ style:{display:'flex',alignItems:'center',gap:8,marginBottom:14} },
        e('span', { className:'live-dot-cyan' }),
        span({ style:{fontSize:12,color:'#67e8f9',fontWeight:600} },
          rv > 0 ? rv+' votes in last 24h' : 'Hottest question right now'
        )
      ),

      e('h2', { style:{fontSize:21,fontWeight:900,lineHeight:1.35,color:'#f1f5f9',
        marginBottom:18,letterSpacing:'-0.4px',position:'relative'} },
        question.question_text
      ),

      div({ style:{display:'flex',flexDirection:'column',gap:8,marginBottom:18,position:'relative'} },
        ...question.options.slice(0,3).map((opt,i) =>
          div({ key:i, style:{
            padding:'11px 16px', borderRadius:12,
            border:'1px solid '+COLORS[i%COLORS.length]+'40',
            background:COLORS[i%COLORS.length]+'12',
            display:'flex',alignItems:'center',gap:10
          }},
            span({ style:{width:20,height:20,borderRadius:'50%',flexShrink:0,
              background:COLORS[i%COLORS.length]+'25',color:COLORS[i%COLORS.length],
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800} }, i+1),
            span({ style:{fontSize:14,fontWeight:600,color:COLORS[i%COLORS.length]} }, opt)
          )
        ),
        question.options.length > 3 &&
          span({ style:{fontSize:12,color:'#475569',paddingLeft:4} },
            '+'+(question.options.length-3)+' more options'
          )
      ),

      div({ style:{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'} },
        span({ style:{fontSize:12,color:'#475569'} }, 'Tap to vote & see live results'),
        span({ style:{fontSize:13,fontWeight:700,color:'#22d3ee',display:'flex',alignItems:'center',gap:4} },
          'Vote now ', span({style:{fontSize:16}},'→')
        )
      )
    )
  );
};

// ── TrendingCard ──────────────────────────────────────────────
const TrendingCard = ({ question, voteCount }) => {
  const voted = localStorage.getItem('voted_'+question.id) !== null;
  return e('a', { href:'#/q/'+question.id, className:'trend-card' },
    div({ style:{display:'flex',gap:4,marginBottom:10,flexWrap:'wrap'} },
      ...question.options.slice(0,2).map((opt,i) =>
        span({ key:i, style:{
          fontSize:10,padding:'2px 8px',borderRadius:999,fontWeight:600,
          border:'1px solid '+COLORS[i%COLORS.length]+'45',
          color:COLORS[i%COLORS.length],background:COLORS[i%COLORS.length]+'15',
          whiteSpace:'nowrap',overflow:'hidden',maxWidth:80,textOverflow:'ellipsis'
        }}, opt)
      )
    ),
    p({ style:{fontSize:13,fontWeight:700,lineHeight:1.4,color:'#e2e8f0',
      marginBottom:14,overflow:'hidden',display:'-webkit-box',
      WebkitLineClamp:2,WebkitBoxOrient:'vertical'} },
      question.question_text
    ),
    div({ style:{display:'flex',justifyContent:'space-between',alignItems:'center'} },
      span({ style:{fontSize:11,color:'#475569'} }, (voteCount||0)+' votes'),
      span({ style:{fontSize:11,fontWeight:700,
        color:voted?'#10b981':'#6366f1',
        background:voted?'rgba(16,185,129,0.1)':'rgba(99,102,241,0.1)',
        padding:'3px 9px',borderRadius:999,
        border:'1px solid '+(voted?'rgba(16,185,129,0.25)':'rgba(99,102,241,0.25)')} },
        voted?'✓':'→'
      )
    )
  );
};

// ── CategoryTile ──────────────────────────────────────────────
const CategoryTile = ({ cat, count }) =>
  e('a', {
    href: '#/feed?cat='+cat.id,
    className: 'cat-tile',
    style:{
      borderColor: cat.color+'35',
      background: cat.color+'0d',
      textDecoration:'none',color:'white'
    }
  },
    div({ style:{fontSize:22,marginBottom:6} }, cat.label.split(' ')[0]),
    div({ style:{fontSize:13,fontWeight:700,color:'#e2e8f0',marginBottom:3,letterSpacing:'-0.2px'} },
      cat.label.split(' ').slice(1).join(' ')
    ),
    div({ style:{fontSize:11,fontWeight:600,color:cat.color+'99'} },
      count ? count+' question'+(count!==1?'s':'') : 'Post first'
    )
  );

// ── QuestionCard (feed) ───────────────────────────────────────
const QuestionCard = ({ question, voteCount, recentCount }) => {
  const voted    = localStorage.getItem('voted_'+question.id) !== null;
  const trending = recentCount >= 3;
  const hot      = voteCount >= 10;
  const cat      = CATEGORIES.find(c=>c.id===question.category);

  return e('a', { href:'#/q/'+question.id, className:'fcard' },
    div({ style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:12} },
      p({ style:{fontSize:16,fontWeight:700,lineHeight:1.45,color:'#f1f5f9',flex:1,margin:0,letterSpacing:'-0.2px'} },
        question.question_text
      ),
      div({ style:{display:'flex',gap:4,flexShrink:0,marginTop:2} },
        trending && span({ style:{fontSize:10,fontWeight:700,color:'#f97316',
          background:'rgba(249,115,22,0.12)',border:'1px solid rgba(249,115,22,0.3)',
          borderRadius:999,padding:'3px 8px'} }, '🔥'),
        hot && !trending && span({ style:{fontSize:10,fontWeight:700,color:'#fbbf24',
          background:'rgba(251,191,36,0.12)',border:'1px solid rgba(251,191,36,0.3)',
          borderRadius:999,padding:'3px 8px'} }, 'HOT')
      )
    ),
    div({ style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8} },
      div({ style:{display:'flex',gap:5,flexWrap:'wrap',flex:1,minWidth:0,alignItems:'center'} },
        cat && cat.id!=='General' && span({ style:{
          fontSize:10,padding:'2px 8px',borderRadius:999,fontWeight:700,flexShrink:0,
          border:'1px solid '+cat.color+'40',color:cat.color,background:cat.color+'12'
        }}, cat.label),
        ...question.options.slice(0,2).map((opt,i) =>
          span({ key:i, style:{fontSize:11,padding:'3px 9px',borderRadius:999,whiteSpace:'nowrap',
            border:'1px solid '+COLORS[i%COLORS.length]+'40',
            color:COLORS[i%COLORS.length],background:COLORS[i%COLORS.length]+'18',fontWeight:500} }, opt)
        ),
        question.options.length > 2 &&
          span({ style:{fontSize:11,color:'#334155',padding:'3px 0'} },
            '+'+(question.options.length-2)+' more')
      ),
      div({ style:{display:'flex',alignItems:'center',gap:6,flexShrink:0} },
        voteCount > 0 && span({ style:{fontSize:12,color:'#334155',fontWeight:500} },
          voteCount+(voteCount===1?' vote':' votes')
        ),
        span({ style:{fontSize:12,fontWeight:700,
          color:voted?'#10b981':'#818cf8',
          background:voted?'rgba(16,185,129,0.1)':'rgba(99,102,241,0.1)',
          padding:'4px 10px',borderRadius:999,
          border:'1px solid '+(voted?'rgba(16,185,129,0.25)':'rgba(99,102,241,0.25)')} },
          voted?'✓':'→'
        )
      )
    )
  );
};

// ── Pill ─────────────────────────────────────────────────────
const Pill = ({label, active, color, onClick}) =>
  e('button', { onClick, style:{
    padding:'7px 16px',borderRadius:999,border:'1px solid',fontSize:12,
    fontWeight:700,cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap',flexShrink:0,
    borderColor: active ? (color||'#6366f1') : '#1a2540',
    background:  active ? (color||'#6366f1')+'22' : 'transparent',
    color:       active ? (color||'#818cf8') : '#64748b',
  }}, label);

// ── Home (landing page) ───────────────────────────────────────
export const Home = () => {
  const [questions,    setQuestions]    = useState([]);
  const [voteCounts,   setVoteCounts]   = useState({});
  const [recentCounts, setRecentCounts] = useState({});
  const [totalVotes,   setTotalVotes]   = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const since24h = new Date(Date.now()-24*60*60*1000).toISOString();
    Promise.all([
      db.from('questions').select('*').order('created_at',{ascending:false}),
      db.from('votes').select('question_id'),
      db.from('votes').select('question_id').gte('created_at', since24h)
    ]).then(([{data:qs},{data:vs},{data:recent}]) => {
      setQuestions(qs||[]);
      setTotalVotes((vs||[]).length);
      const counts  = (vs||[]).reduce((a,v)=>{ a[v.question_id]=(a[v.question_id]||0)+1; return a; },{});
      const rcounts = (recent||[]).reduce((a,v)=>{ a[v.question_id]=(a[v.question_id]||0)+1; return a; },{});
      setVoteCounts(counts);
      setRecentCounts(rcounts);
      setLoading(false);
    });
  }, []);

  const featuredQ = !loading && questions.length > 0
    ? questions.reduce((best,q) =>
        (recentCounts[q.id]||0) > (recentCounts[best.id]||0) ? q : best
      , questions[0])
    : null;

  const trendingQs = [...questions]
    .sort((a,b) => (recentCounts[b.id]||0)-(recentCounts[a.id]||0))
    .filter(q => q.id !== featuredQ?.id)
    .slice(0,8);

  const catCounts = questions.reduce((acc,q) => {
    const c = q.category||'General'; acc[c]=(acc[c]||0)+1; return acc;
  }, {});

  const voteCountAnimated = useCountUp(loading ? 0 : totalVotes);
  const questCountAnimated = useCountUp(loading ? 0 : questions.length);

  return div({ style:{background:'#020817', minHeight:'100vh'}, className:'page-in' },

    // ── HERO ────────────────────────────────────────────────
    div({ style:{position:'relative', overflow:'hidden', paddingTop:58} },

      // Dot grid background
      div({ style:{position:'absolute',inset:0,
        backgroundImage:'radial-gradient(rgba(129,140,248,0.11) 1px,transparent 1px)',
        backgroundSize:'26px 26px',pointerEvents:'none'} }),

      // Glow blobs
      div({ style:{position:'absolute',top:'-20%',left:'-15%',width:'65%',height:'120%',
        background:'radial-gradient(ellipse,rgba(99,102,241,0.22) 0%,transparent 60%)',pointerEvents:'none'} }),
      div({ style:{position:'absolute',top:'10%',right:'-15%',width:'55%',height:'90%',
        background:'radial-gradient(ellipse,rgba(6,182,212,0.12) 0%,transparent 60%)',pointerEvents:'none'} }),
      div({ style:{position:'absolute',bottom:'-10%',left:'30%',width:'40%',height:'60%',
        background:'radial-gradient(ellipse,rgba(232,121,249,0.08) 0%,transparent 60%)',pointerEvents:'none'} }),

      div({ style:{position:'relative',zIndex:1,maxWidth:640,margin:'0 auto',
        padding:'52px 20px 48px',textAlign:'center'} },

        // Live badge
        div({ style:{display:'inline-flex',alignItems:'center',gap:8,
          background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.18)',
          borderRadius:999,padding:'6px 16px',fontSize:12,color:'#6ee7b7',marginBottom:28} },
          e('span',{className:'live-dot'}),
          span(null,'Live · real-time results')
        ),

        // Headline
        e('h1', { style:{
          fontSize:50,fontWeight:900,lineHeight:1.06,letterSpacing:'-2.5px',
          marginBottom:16,
          background:'linear-gradient(135deg, #e0e7ff 0%, #818cf8 45%, #22d3ee 100%)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'
        }}, 'The world votes.', e('br',null), 'Right now.'),

        p({ style:{color:'#64748b',fontSize:16,lineHeight:1.65,marginBottom:36,
          maxWidth:420,margin:'0 auto 36px'} },
          'Ask anything. Get real answers from real people around the planet.'
        ),

        // CTA buttons
        div({ style:{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:44} },
          e('a', { href:'#/post', className:'btn-glow' }, '+ Ask the World'),
          e('a', { href:'#/feed', className:'btn-outline' }, 'Browse Feed →')
        ),

        // Stats strip
        !loading && div({ style:{
          display:'flex', maxWidth:380, margin:'0 auto',
          background:'rgba(255,255,255,0.025)',
          border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:20,overflow:'hidden'
        }},
          e(StatBlock,{value:voteCountAnimated,label:'Votes',grad:'linear-gradient(135deg,#818cf8,#22d3ee)'}),
          div({style:{width:1,background:'rgba(255,255,255,0.05)'}}),
          e(StatBlock,{value:questCountAnimated,label:'Questions',grad:'linear-gradient(135deg,#22d3ee,#e879f9)'}),
          div({style:{width:1,background:'rgba(255,255,255,0.05)'}}),
          e(StatBlock,{value:47,label:'Countries',grad:'linear-gradient(135deg,#e879f9,#818cf8)'})
        ),

        loading && div({ style:{height:72} })
      )
    ),

    // ── CONTENT SECTIONS ──────────────────────────────────
    div({ style:{maxWidth:640,margin:'0 auto',padding:'32px 16px 80px'} },

      // Featured question
      !loading && featuredQ && e(FeaturedQuestion,{
        question:featuredQ,
        recentVotes:recentCounts[featuredQ.id]||0
      }),

      // Trending horizontal scroll
      !loading && trendingQs.length > 0 && div({ style:{marginBottom:36} },
        div({ className:'s-label' },
          span({style:{color:'#818cf8',fontSize:11}},'↑'),
          span(null,'Trending Now')
        ),
        div({ className:'scroll-x' },
          ...trendingQs.map(q =>
            e(TrendingCard,{key:q.id,question:q,voteCount:voteCounts[q.id]||0})
          ),
          e('a',{ href:'#/feed', style:{
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            flexShrink:0,width:100,minHeight:120,
            background:'rgba(99,102,241,0.07)',
            border:'1px solid rgba(99,102,241,0.2)',
            borderRadius:16,textDecoration:'none',
            color:'#818cf8',gap:8,textAlign:'center',padding:16
          }},
            span({style:{fontSize:28,lineHeight:1}},'→'),
            span({style:{fontSize:12,fontWeight:700}},'See all')
          )
        )
      ),

      // Loading skeletons
      loading && div({ style:{display:'flex',flexDirection:'column',gap:12,marginBottom:32} },
        ...[1,2].map(i => div({key:i,className:'skeleton',style:{height:80}}))
      ),

      // Categories
      div({ style:{marginBottom:36} },
        div({ className:'s-label' },
          span({style:{color:'#818cf8',fontSize:11}},'#'),
          span(null,'Explore Topics')
        ),
        div({ className:'cat-grid' },
          ...CATEGORIES.map(cat =>
            e(CategoryTile,{key:cat.id,cat,count:catCounts[cat.id]||0})
          )
        )
      ),

      // Ask CTA card
      div({ style:{
        background:'linear-gradient(#0d1424,#0d1424) padding-box, linear-gradient(135deg,rgba(129,140,248,0.45),rgba(34,211,238,0.25)) border-box',
        border:'1px solid transparent',borderRadius:24,
        padding:'28px 24px',textAlign:'center'
      }},
        div({style:{fontSize:36,marginBottom:12}},'🌍'),
        e('h3',{style:{fontSize:22,fontWeight:900,marginBottom:8,letterSpacing:'-0.5px',color:'#f1f5f9'}},
          'Got a take?'
        ),
        p({style:{color:'#64748b',fontSize:14,marginBottom:22,lineHeight:1.55}},
          'Ask the world anything. See what everyone really thinks — live.'
        ),
        e('a',{href:'#/post',className:'btn-glow'},
          '+ Ask the World'
        )
      )
    )
  );
};

// ── FeedPage ──────────────────────────────────────────────────
export const FeedPage = () => {
  const [questions,    setQuestions]    = useState([]);
  const [voteCounts,   setVoteCounts]   = useState({});
  const [recentCounts, setRecentCounts] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [sort,         setSort]         = useState('trending');
  const [activeCat,    setActiveCat]    = useState('All');

  // Read category from URL hash query param
  useEffect(() => {
    const hash = window.location.hash;
    const catMatch = hash.match(/\?cat=([^&]+)/);
    if (catMatch) setActiveCat(decodeURIComponent(catMatch[1]));
  }, []);

  useEffect(() => {
    const since24h = new Date(Date.now()-24*60*60*1000).toISOString();
    Promise.all([
      db.from('questions').select('*').order('created_at',{ascending:false}),
      db.from('votes').select('question_id'),
      db.from('votes').select('question_id').gte('created_at', since24h)
    ]).then(([{data:qs},{data:vs},{data:recent}]) => {
      setQuestions(qs||[]);
      const counts  = (vs||[]).reduce((a,v)=>{ a[v.question_id]=(a[v.question_id]||0)+1; return a; },{});
      const rcounts = (recent||[]).reduce((a,v)=>{ a[v.question_id]=(a[v.question_id]||0)+1; return a; },{});
      setVoteCounts(counts);
      setRecentCounts(rcounts);
      setLoading(false);
    });
  }, []);

  const filtered = activeCat==='All'
    ? questions
    : questions.filter(q=>(q.category||'General')===activeCat);

  const sorted = [...filtered].sort((a,b) => {
    if (sort==='trending') {
      const ra=recentCounts[a.id]||0, rb=recentCounts[b.id]||0;
      if (rb!==ra) return rb-ra;
      return (voteCounts[b.id]||0)-(voteCounts[a.id]||0);
    }
    return 0;
  });

  return div({ style:{minHeight:'100vh',background:'#020817',paddingTop:58}, className:'page-in' },

    // Sticky filter bar
    div({ className:'feed-header' },
      // Sort + count
      div({ style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8} },
        div({ style:{display:'flex',gap:4,background:'#0d1424',border:'1px solid #1a2540',borderRadius:999,padding:3} },
          e(Pill,{label:'🔥 Trending',active:sort==='trending',onClick:()=>setSort('trending')}),
          e(Pill,{label:'✨ New',     active:sort==='new',      onClick:()=>setSort('new')})
        ),
        !loading && span({style:{fontSize:12,color:'#334155',fontWeight:500}},
          sorted.length+' question'+(sorted.length!==1?'s':'')
        )
      ),
      // Category strip
      div({ style:{display:'flex',gap:7,overflowX:'auto',scrollbarWidth:'none',WebkitOverflowScrolling:'touch'} },
        e(Pill,{label:'🌐 All',active:activeCat==='All',onClick:()=>setActiveCat('All')}),
        ...CATEGORIES.map(cat =>
          e(Pill,{key:cat.id,label:cat.label,color:cat.color,
            active:activeCat===cat.id,onClick:()=>setActiveCat(cat.id)})
        )
      )
    ),

    // Feed
    div({ style:{maxWidth:640,margin:'0 auto',padding:'16px 16px 80px'} },
      loading
        ? div({style:{display:'flex',flexDirection:'column',gap:10}},
            ...[1,2,3].map(i=>div({key:i,className:'skeleton',style:{height:96}})))
        : sorted.length === 0
        ? div({style:{textAlign:'center',padding:'60px 0'},className:'fade-up'},
            div({style:{fontSize:52,marginBottom:16}},'🌍'),
            p({style:{color:'#94a3b8',fontSize:17,fontWeight:600,marginBottom:8}},
              activeCat==='All'?'No questions yet':'No '+activeCat+' questions yet'),
            p({style:{color:'#475569',fontSize:15}},'Be the first to post one!')
          )
        : div({style:{display:'flex',flexDirection:'column',gap:10},className:'fade-up'},
            ...sorted.map(q=>e(QuestionCard,{key:q.id,question:q,
              voteCount:voteCounts[q.id]||0,recentCount:recentCounts[q.id]||0}))
          )
    )
  );
};
