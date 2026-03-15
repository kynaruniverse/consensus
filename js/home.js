// js/home.js
import { e, div, span, p, db, COLORS } from './db.js';
const { useState, useEffect } = React;

// ── QuestionCard ──────────────────────────────────────────────
const QuestionCard = ({ question, voteCount, recentCount }) => {
  const voted    = localStorage.getItem('voted_'+question.id) !== null;
  const trending = recentCount >= 3;
  const hot      = voteCount >= 10;

  return e('a', { href:'#/q/'+question.id, className:'card card-tap',
    style:{display:'block',padding:'18px 20px'} },

    // Top row
    div({ style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:12} },
      p({ style:{fontSize:16,fontWeight:600,lineHeight:1.45,color:'#f1f5f9',flex:1,margin:0} },
        question.question_text
      ),
      div({ style:{display:'flex',gap:4,flexShrink:0,marginTop:2} },
        trending && span({ style:{fontSize:10,fontWeight:700,color:'#f97316',
          background:'rgba(249,115,22,0.12)',border:'1px solid rgba(249,115,22,0.3)',
          borderRadius:999,padding:'2px 7px',letterSpacing:'0.05em'} }, '🔥 Trending'),
        hot && !trending && span({ style:{fontSize:10,fontWeight:700,color:'#fbbf24',
          background:'rgba(251,191,36,0.12)',border:'1px solid rgba(251,191,36,0.3)',
          borderRadius:999,padding:'2px 7px',letterSpacing:'0.05em'} }, 'HOT')
      )
    ),

    // Bottom row
    div({ style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10} },
      div({ style:{display:'flex',gap:5,flexWrap:'wrap',flex:1,minWidth:0} },
        ...question.options.slice(0,3).map((opt,i) =>
          span({ key:i, style:{fontSize:11,padding:'3px 9px',borderRadius:999,whiteSpace:'nowrap',
            border:'1px solid '+COLORS[i%COLORS.length]+'40',
            color:COLORS[i%COLORS.length],background:COLORS[i%COLORS.length]+'18',fontWeight:500} }, opt)
        ),
        question.options.length > 3 &&
          span({ style:{fontSize:11,color:'#475569',padding:'3px 0',alignSelf:'center'} },
            '+'+(question.options.length-3)+' more')
      ),
      div({ style:{display:'flex',alignItems:'center',gap:6,flexShrink:0} },
        voteCount > 0 && span({ style:{fontSize:12,color:'#475569',fontWeight:500} },
          voteCount+(voteCount===1?' vote':' votes')
        ),
        span({ style:{fontSize:12,fontWeight:700,
          color:voted?'#10b981':'#818cf8',
          background:voted?'rgba(16,185,129,0.1)':'rgba(99,102,241,0.1)',
          padding:'4px 10px',borderRadius:999,
          border:'1px solid '+(voted?'rgba(16,185,129,0.25)':'rgba(99,102,241,0.25)')} },
          voted ? '✓' : '→'
        )
      )
    )
  );
};

// ── TabBtn ────────────────────────────────────────────────────
const TabBtn = ({ id, label, active, onClick }) =>
  e('button', {
    onClick,
    style:{padding:'7px 18px',borderRadius:999,border:'none',fontSize:13,fontWeight:700,cursor:'pointer',
      background: active ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
      color: active ? 'white' : '#64748b',
      boxShadow: active ? '0 2px 10px rgba(99,102,241,0.35)' : 'none',
      transition:'all 0.2s'}
  }, label);

// ── Home ──────────────────────────────────────────────────────
export const Home = () => {
  const [questions,    setQuestions]    = useState([]);
  const [voteCounts,   setVoteCounts]   = useState({});
  const [recentCounts, setRecentCounts] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [sort,         setSort]         = useState('trending');

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

  const sorted = [...questions].sort((a,b) => {
    if (sort==='trending') {
      const ra=recentCounts[a.id]||0, rb=recentCounts[b.id]||0;
      if (rb!==ra) return rb-ra;
      return (voteCounts[b.id]||0)-(voteCounts[a.id]||0);
    }
    return 0; // 'new' — already sorted by created_at desc from DB
  });

  return div({ style:{maxWidth:640,margin:'0 auto',padding:'58px 16px 80px',position:'relative'} },

    // Hero
    div({ style:{position:'relative',textAlign:'center',padding:'44px 0 36px',overflow:'hidden'} },
      div({ style:{position:'absolute',top:'20%',left:'10%',width:260,height:260,
        background:'rgba(99,102,241,0.12)',borderRadius:'50%',filter:'blur(70px)',pointerEvents:'none'} }),
      div({ style:{position:'absolute',top:'10%',right:'5%',width:200,height:200,
        background:'rgba(167,139,250,0.10)',borderRadius:'50%',filter:'blur(60px)',pointerEvents:'none'} }),
      div({ style:{position:'relative',zIndex:1} },
        e('h1', { style:{fontSize:42,fontWeight:900,lineHeight:1.15,marginBottom:14,letterSpacing:'-1px',
          background:'linear-gradient(135deg,#c7d2fe 0%,#818cf8 40%,#a78bfa 100%)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'} },
          'What does the', e('br',null), 'world think?'
        ),
        p({ style:{color:'#94a3b8',fontSize:17,lineHeight:1.5,marginBottom:20} },
          'Vote on anything. See live results from around the planet.'
        ),
        div({ style:{display:'inline-flex',alignItems:'center',gap:8,
          background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',
          borderRadius:999,padding:'6px 14px',fontSize:13,color:'#6ee7b7'} },
          e('span',{className:'live-dot'}),
          'Live results · updating now'
        )
      )
    ),

    // Sort tabs
    div({ style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16} },
      div({ style:{display:'flex',gap:4,background:'#0d1424',border:'1px solid #1a2540',borderRadius:999,padding:4} },
        e(TabBtn,{id:'trending',label:'🔥 Trending',active:sort==='trending',onClick:()=>setSort('trending')}),
        e(TabBtn,{id:'new',     label:'✨ New',      active:sort==='new',      onClick:()=>setSort('new')})
      ),
      !loading && span({ style:{fontSize:12,color:'#334155',fontWeight:500} },
        sorted.length+' question'+(sorted.length!==1?'s':'')
      )
    ),

    // Feed
    loading
      ? div({ style:{display:'flex',flexDirection:'column',gap:10} },
          ...[1,2,3].map(i => div({key:i, className:'skeleton', style:{height:88}}))
        )
      : sorted.length === 0
      ? div({ style:{textAlign:'center',padding:'60px 0'}, className:'fade-up' },
          div({style:{fontSize:52,marginBottom:16}},'🌍'),
          p({style:{color:'#94a3b8',fontSize:18,fontWeight:600,marginBottom:8}},'No questions yet'),
          p({style:{color:'#475569',fontSize:15}},'Be the first to ask the world something.')
        )
      : div({ style:{display:'flex',flexDirection:'column',gap:10}, className:'fade-up' },
          ...sorted.map(q => e(QuestionCard,{key:q.id,question:q,
            voteCount:voteCounts[q.id]||0,recentCount:recentCounts[q.id]||0}))
        )
  );
};
