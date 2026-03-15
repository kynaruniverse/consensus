// js/question.js
import { e, div, span, p, db, COLORS, getFlag } from './db.js';
const { useState, useEffect } = React;

// ── Canvas helpers ────────────────────────────────────────────
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}
function wrapText(ctx,text,x,y,maxW,lineH){
  const words=text.split(' '); let line='';
  for(let i=0;i<words.length;i++){
    const test=line+words[i]+' ';
    if(ctx.measureText(test).width>maxW&&i>0){ctx.fillText(line,x,y);line=words[i]+' ';y+=lineH;}
    else{line=test;}
  }
  ctx.fillText(line,x,y);
}

// ── ResultBars ────────────────────────────────────────────────
const ResultBars = ({ options, votes }) => {
  const total = votes.length;
  return div({ style:{display:'flex',flexDirection:'column',gap:16} },
    ...options.map((opt,i) => {
      const count = votes.filter(v=>v.option_index===i).length;
      const pct   = total>0 ? Math.round((count/total)*100) : 0;
      const isWin = total>0 && count===Math.max(...options.map((_,j)=>votes.filter(v=>v.option_index===j).length)) && count>0;
      return div({key:i},
        div({ style:{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:7} },
          span({ style:{fontSize:14,fontWeight:600,color:'#e2e8f0',lineHeight:1.4,flex:1,paddingRight:12} }, opt),
          span({ style:{fontSize:18,fontWeight:900,color:COLORS[i%COLORS.length],flexShrink:0} },
            total>0 ? pct+'%' : '—'
          )
        ),
        div({ style:{background:'#1e293b',borderRadius:999,height:9,overflow:'hidden',marginBottom:5} },
          div({ className:'bar-fill', style:{height:'100%',borderRadius:999,
            background:'linear-gradient(90deg,'+COLORS[i%COLORS.length]+','+COLORS[i%COLORS.length]+'99)',
            width:pct+'%',boxShadow:'0 0 8px '+COLORS[i%COLORS.length]+'60'} })
        ),
        span({ style:{fontSize:12,color:'#475569'} },
          count+' vote'+(count!==1?'s':'')+(isWin&&total>0?' 🏆':'')
        )
      );
    })
  );
};

// ── DemographicBreakdown ──────────────────────────────────────
const DemographicBreakdown = ({ votes, options }) => {
  // Only show if at least 5 votes have demographic data
  const withGender = votes.filter(v=>v.gender);
  const withAge    = votes.filter(v=>v.age_range);
  if (withGender.length < 5 && withAge.length < 5) return null;

  const genderGroups = [...new Set(withGender.map(v=>v.gender))];
  const ageGroups    = [...new Set(withAge.map(v=>v.age_range))];

  const winnerForGroup = (groupVotes) => {
    if (!groupVotes.length) return null;
    const counts = options.map((_,i)=>groupVotes.filter(v=>v.option_index===i).length);
    const maxI   = counts.indexOf(Math.max(...counts));
    return { option: options[maxI], pct: Math.round((counts[maxI]/groupVotes.length)*100), color: COLORS[maxI%COLORS.length] };
  };

  return div({ className:'demo-section' },
    withGender.length >= 5 && div({ style:{marginBottom:20} },
      p({ style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12} },
        '👤  By Gender'
      ),
      ...genderGroups.map(g => {
        const gv = withGender.filter(v=>v.gender===g);
        const w  = winnerForGroup(gv);
        if (!w) return null;
        return div({ key:g, className:'demo-row' },
          span({ className:'demo-label' }, g),
          div({ className:'demo-track' },
            div({ className:'demo-fill', style:{width:w.pct+'%',background:w.color} })
          ),
          span({ className:'demo-pct' }, w.pct+'%'),
          span({ style:{fontSize:12,color:w.color,marginLeft:6,fontWeight:600,flexShrink:0,maxWidth:100,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'} }, w.option)
        );
      }).filter(Boolean)
    ),
    withAge.length >= 5 && div(null,
      p({ style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12} },
        '📊  By Age Group'
      ),
      ...ageGroups.sort().map(a => {
        const av = withAge.filter(v=>v.age_range===a);
        const w  = winnerForGroup(av);
        if (!w) return null;
        return div({ key:a, className:'demo-row' },
          span({ className:'demo-label' }, a),
          div({ className:'demo-track' },
            div({ className:'demo-fill', style:{width:w.pct+'%',background:w.color} })
          ),
          span({ className:'demo-pct' }, w.pct+'%'),
          span({ style:{fontSize:12,color:w.color,marginLeft:6,fontWeight:600,flexShrink:0,maxWidth:100,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'} }, w.option)
        );
      }).filter(Boolean)
    )
  );
};

// ── QuestionPage ──────────────────────────────────────────────
export const QuestionPage = ({ id, user }) => {
  const [question,     setQuestion]     = useState(null);
  const [votes,        setVotes]        = useState([]);
  const [myVote,       setMyVote]       = useState(null);
  const [myPrediction, setMyPrediction] = useState(null);
  const [predLocked,   setPredLocked]   = useState(false);
  const [country,      setCountry]      = useState('XX');
  const [voting,       setVoting]       = useState(false);
  const [msg,          setMsg]          = useState('');
  const [newVote,      setNewVote]      = useState(false);
  const [showReveal,   setShowReveal]   = useState(false);

  useEffect(()=>{
    // Load prediction from localStorage
    const pr = localStorage.getItem('pred_'+id);
    if (pr !== null) { setMyPrediction(parseInt(pr,10)); setPredLocked(true); }

    // Check vote: localStorage first (fast), then DB if logged in (authoritative)
    const local = localStorage.getItem('voted_'+id);
    if (local !== null) {
      setMyVote(parseInt(local,10));
    } else if (user?.id) {
      // User is logged in — check DB in case they voted on another device
      // or after clearing browser data
      db.from('votes')
        .select('option_index')
        .eq('question_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({data})=>{
          if (data) {
            setMyVote(data.option_index);
            localStorage.setItem('voted_'+id, String(data.option_index));
            setPredLocked(true);
          }
        });
    }
  },[id, user?.id]);

  useEffect(()=>{
    fetch('https://ipapi.co/json/').then(r=>r.json())
      .then(d=>setCountry(d.country_code||'XX')).catch(()=>{});
  },[]);

  useEffect(()=>{
    if (!id) return;
    db.from('questions').select('*').eq('id',id).single().then(({data})=>setQuestion(data));
    const load = async()=>{
      const {data} = await db.from('votes').select('*').eq('question_id',id);
      setVotes(data||[]);
    };
    load();
    const ch = db.channel('votes:'+id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'votes',filter:'question_id=eq.'+id},
        ()=>{ load(); setNewVote(true); setTimeout(()=>setNewVote(false),1200); })
      .subscribe();
    return ()=>db.removeChannel(ch);
  },[id]);

  const castVote = async index=>{
    if (myVote!==null||voting) return;
    setVoting(true);

    // For logged-in users: double-check DB before inserting
    if (user?.id) {
      const {data:existing} = await db.from('votes')
        .select('option_index')
        .eq('question_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        // Already voted — sync local state and bail
        setMyVote(existing.option_index);
        localStorage.setItem('voted_'+id, String(existing.option_index));
        setPredLocked(true);
        setVoting(false);
        return;
      }
    }

    const payload = { question_id:id, option_index:index, country_code:country };
    if (user) {
      payload.user_id   = user.id;
      payload.age_range = user.age_range || null;
      payload.gender    = user.gender    || null;
    }
    const {error} = await db.from('votes').insert(payload);
    setVoting(false);
    if (error) { alert('Vote failed: '+error.message); return; }
    setMyVote(index);
    localStorage.setItem('voted_'+id, String(index));
    setPredLocked(true);
    setTimeout(()=>setShowReveal(true), 800);
  };

  const savePrediction = index=>{
    if (predLocked) return;
    setMyPrediction(index);
    localStorage.setItem('pred_'+id, String(index));
  };

  const copyLink = ()=>{
    navigator.clipboard.writeText(window.location.href)
      .then(()=>{ setMsg('✓ Link copied!'); setTimeout(()=>setMsg(''),3000); })
      .catch(()=>setMsg('Copy the URL manually.'));
  };

  // ── Share card via Canvas ─────────────────────────────────
  const generateShareCard = ()=>{
    if (total===0) { setMsg('No votes yet — share the link to get votes first!'); setTimeout(()=>setMsg(''),3000); return; }
    const W=640,H=400;
    const canvas=document.createElement('canvas');
    canvas.width=W*2; canvas.height=H*2;
    const ctx=canvas.getContext('2d');
    ctx.scale(2,2);

    ctx.fillStyle='#020817'; ctx.fillRect(0,0,W,H);

    const blob=(x,y,r,col)=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,col); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    };
    blob(80,80,180,'rgba(99,102,241,0.2)');
    blob(560,340,150,'rgba(167,139,250,0.15)');

    ctx.fillStyle='#0d1424'; roundRect(ctx,24,24,W-48,H-48,20); ctx.fill();
    ctx.strokeStyle='#1a2540'; ctx.lineWidth=1; roundRect(ctx,24,24,W-48,H-48,20); ctx.stroke();

    ctx.font='700 15px sans-serif';
    ctx.fillStyle='#818cf8'; ctx.fillText('con',44,60);
    const conW=ctx.measureText('con').width;
    ctx.fillStyle='#94a3b8'; ctx.fillText('sensus',44+conW,60);

    ctx.beginPath(); ctx.arc(W-44,53,5,0,Math.PI*2); ctx.fillStyle='#10b981'; ctx.fill();
    ctx.font='600 12px sans-serif'; ctx.fillStyle='#6ee7b7'; ctx.textAlign='right';
    ctx.fillText('LIVE · '+total+' vote'+(total!==1?'s':''),W-56,58);
    ctx.textAlign='left';

    ctx.font='700 18px sans-serif'; ctx.fillStyle='#f1f5f9';
    wrapText(ctx,question.question_text,44,96,W-88,26);

    const barTop=question.options.length>3?148:158;
    const barGap=question.options.length>3?42:48;
    const barW=W-88;

    question.options.forEach((opt,i)=>{
      const count=votes.filter(v=>v.option_index===i).length;
      const pct=total>0?Math.round((count/total)*100):0;
      const y=barTop+i*barGap; const col=COLORS[i%COLORS.length];
      ctx.font='600 13px sans-serif'; ctx.fillStyle=col;
      ctx.fillText(opt.length>34?opt.slice(0,33)+'…':opt,44,y);
      ctx.font='800 13px sans-serif'; ctx.textAlign='right'; ctx.fillStyle=col;
      ctx.fillText(pct+'%',W-44,y); ctx.textAlign='left';
      ctx.fillStyle='#1e293b'; roundRect(ctx,44,y+7,barW,10,5); ctx.fill();
      if(pct>0){
        const grad=ctx.createLinearGradient(44,0,44+barW*(pct/100),0);
        grad.addColorStop(0,col); grad.addColorStop(1,col+'88');
        ctx.fillStyle=grad; ctx.shadowColor=col; ctx.shadowBlur=8;
        roundRect(ctx,44,y+7,barW*(pct/100),10,5); ctx.fill();
        ctx.shadowBlur=0;
      }
    });

    const fy=H-48;
    ctx.strokeStyle='#1a2540'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(44,fy); ctx.lineTo(W-44,fy); ctx.stroke();
    ctx.font='500 11px sans-serif'; ctx.fillStyle='#334155';
    ctx.fillText(new Date().toLocaleDateString(),44,fy+17);
    ctx.textAlign='right';
    ctx.fillText('kynaruniverse.github.io/consensus',W-44,fy+17);
    ctx.textAlign='left';

    const a=document.createElement('a');
    a.download='consensus-'+id.slice(0,8)+'.png';
    a.href=canvas.toDataURL('image/png');
    a.click();
    setMsg('✓ Image saved — post it everywhere!');
    setTimeout(()=>setMsg(''),3000);
  };

  if (!question) return div({style:{paddingTop:130,textAlign:'center'}},
    div({style:{color:'#334155',fontSize:32,marginBottom:12}},'●'),
    p({style:{color:'#475569',fontSize:16}},'Loading...')
  );

  const total        = votes.length;
  const hasVoted     = myVote!==null;
  const countryStats = votes.reduce((acc,v)=>{ const c=v.country_code||'XX'; acc[c]=(acc[c]||0)+1; return acc; },{});
  const topCountries = Object.entries(countryStats).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const winnerIdx    = total>0
    ? question.options.reduce((best,_,i)=>
        votes.filter(v=>v.option_index===i).length > votes.filter(v=>v.option_index===best).length ? i : best
      , 0)
    : null;
  const predCorrect = predLocked && winnerIdx!==null && myPrediction===winnerIdx;

  return div({ style:{maxWidth:640,margin:'0 auto',padding:'58px 16px 80px'}, className:'fade-up' },

    // Back
    e('a',{href:'#/',style:{display:'inline-flex',alignItems:'center',gap:6,color:'#64748b',
      fontSize:13,fontWeight:500,padding:'16px 0 24px'}}, '← All questions'),

    // Title
    e('h1',{style:{fontSize:26,fontWeight:900,lineHeight:1.4,marginBottom:8,
      letterSpacing:'-0.3px',color:'#f1f5f9'}}, question.question_text),

    // Live badge
    div({style:{display:'flex',alignItems:'center',gap:10,marginBottom:28}},
      div({style:{display:'flex',alignItems:'center',gap:6,
        background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',
        borderRadius:999,padding:'4px 12px',fontSize:12,color:'#6ee7b7',
        boxShadow:newVote?'0 0 12px rgba(16,185,129,0.3)':'none',transition:'all 0.3s'}},
        e('span',{className:'live-dot'}),
        span(null, total+(total===1?' vote':' votes')+' · live')
      ),
      !hasVoted && div({style:{fontSize:12,color:'#475569'}},'Cast your vote below')
    ),

    // ── Prediction panel ───────────────────────────────────
    !hasVoted && div({className:'card',style:{padding:20,marginBottom:20,
      border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.05)'}},
      div({style:{display:'flex',alignItems:'center',gap:8,marginBottom:14}},
        span({style:{fontSize:18}},'🔮'),
        div(null,
          div({style:{fontSize:14,fontWeight:700,color:'#c7d2fe'}},
            myPrediction!==null ? 'Prediction locked in!' : 'Predict the winner'
          ),
          div({style:{fontSize:12,color:'#64748b',marginTop:1}},
            myPrediction!==null
              ? 'You predicted: '+question.options[myPrediction]
              : 'Guess which option wins before you vote'
          )
        )
      ),
      myPrediction===null
        ? div({style:{display:'flex',flexDirection:'column',gap:8}},
            ...question.options.map((opt,i)=>
              e('button',{key:i,onClick:()=>savePrediction(i),
                style:{padding:'10px 14px',borderRadius:12,border:'1px solid #1a2540',
                  background:'#0d1424',color:'#94a3b8',fontSize:14,fontWeight:500,
                  cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:8}},
                span({style:{width:20,height:20,borderRadius:'50%',flexShrink:0,
                  background:COLORS[i%COLORS.length]+'25',color:COLORS[i%COLORS.length],
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}},i+1),
                opt
              )
            )
          )
        : div({style:{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:12,
            background:COLORS[myPrediction%COLORS.length]+'15',
            border:'1px solid '+COLORS[myPrediction%COLORS.length]+'40'}},
            span({style:{width:20,height:20,borderRadius:'50%',flexShrink:0,
              background:COLORS[myPrediction%COLORS.length]+'30',color:COLORS[myPrediction%COLORS.length],
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}},
              myPrediction+1),
            span({style:{fontSize:14,fontWeight:600,color:COLORS[myPrediction%COLORS.length]}},
              question.options[myPrediction]),
            span({style:{marginLeft:'auto',fontSize:12,color:'#64748b'}},'vote to reveal →')
          )
    ),

    // ── Prediction reveal ──────────────────────────────────
    showReveal && predLocked && myPrediction!==null && total>0 &&
      div({style:{marginBottom:20,padding:20,borderRadius:16,textAlign:'center',
        background:predCorrect?'rgba(16,185,129,0.08)':'rgba(248,113,113,0.08)',
        border:'1px solid '+(predCorrect?'rgba(16,185,129,0.3)':'rgba(248,113,113,0.3)')},
        className:'fade-up'},
        div({style:{fontSize:32,marginBottom:8}}, predCorrect?'🎯':'😬'),
        div({style:{fontSize:16,fontWeight:800,color:predCorrect?'#34d399':'#f87171',marginBottom:4}},
          predCorrect?'Nailed it!':'Not quite!'
        ),
        div({style:{fontSize:13,color:'#64748b'}},
          predCorrect
            ? 'Your prediction was right — '+question.options[winnerIdx]+' is winning!'
            : 'You predicted '+question.options[myPrediction]+', but '+question.options[winnerIdx]+' is leading.'
        )
      ),

    // ── Vote buttons ───────────────────────────────────────
    div({style:{display:'flex',flexDirection:'column',gap:10,marginBottom:32}},
      ...question.options.map((opt,i)=>{
        const count = votes.filter(v=>v.option_index===i).length;
        const pct   = total>0?Math.round((count/total)*100):0;
        const isMe  = myVote===i;
        const isWin = winnerIdx===i && total>0;
        return e('button',{key:i,onClick:()=>castVote(i),disabled:hasVoted||voting,
          className:'vote-btn'+(isMe?' voted-me':''),
          style:{border:'1px solid '+(isMe?'#6366f1':'#1a2540')}},
          hasVoted && div({style:{position:'absolute',left:0,top:0,height:'100%',borderRadius:16,
            background:'linear-gradient(90deg,'+COLORS[i%COLORS.length]+'30,'+COLORS[i%COLORS.length]+'10)',
            width:pct+'%',transition:'width 1s cubic-bezier(0.4,0,0.2,1)'}}),
          div({style:{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}},
            span({style:{display:'flex',alignItems:'center',gap:9,flex:1}},
              span({style:{width:10,height:10,borderRadius:'50%',flexShrink:0,
                background:COLORS[i%COLORS.length],boxShadow:'0 0 6px '+COLORS[i%COLORS.length]+'60'}}),
              span({style:{fontWeight:isMe?700:600,color:isMe?'#e0e7ff':'#e2e8f0'}},opt),
              isMe  && span({style:{fontSize:12,color:'#818cf8',fontWeight:700}},'✓ Your vote'),
              isWin && span({style:{fontSize:14}},'🏆')
            ),
            hasVoted && span({style:{fontSize:17,fontWeight:900,flexShrink:0,
              color:COLORS[i%COLORS.length],minWidth:44,textAlign:'right'}},pct+'%')
          )
        );
      })
    ),

    // ── Results card ───────────────────────────────────────
    div({className:'card',style:{padding:24,marginBottom:12}},

      div({style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}},
        div(null,
          e('h2',{style:{fontSize:17,fontWeight:800,color:'#f1f5f9',marginBottom:3}},'Live Results'),
          p({style:{color:'#475569',fontSize:13,lineHeight:1.4,maxWidth:320}},question.question_text)
        ),
        div({style:{textAlign:'right',flexShrink:0,marginLeft:12}},
          div({style:{display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end',marginBottom:4}},
            e('span',{className:'live-dot'}),
            span({style:{fontSize:11,color:'#64748b',fontWeight:600,letterSpacing:'0.06em'}},'LIVE')
          ),
          div({style:{fontSize:30,fontWeight:900,color:'#f1f5f9',lineHeight:1}},total),
          div({style:{fontSize:11,color:'#475569',marginTop:2}},'total votes')
        )
      ),

      total===0
        ? div({style:{textAlign:'center',padding:'36px 0',color:'#334155'}},
            div({style:{fontSize:40,marginBottom:10}},'🗳️'),
            p({style:{fontSize:15,color:'#475569'}},'No votes yet — be the first!')
          )
        : div(null,
            e(ResultBars,{options:question.options,votes}),

            // Country breakdown
            topCountries.length>0 && div({style:{marginTop:24,paddingTop:20,borderTop:'1px solid #1a2540'}},
              p({style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14}},
                '🌍  By Country'),
              div({style:{display:'flex',flexDirection:'column',gap:11}},
                ...topCountries.map(([code,count])=>{
                  const pct=Math.round((count/total)*100);
                  return div({key:code,style:{display:'flex',alignItems:'center',gap:10}},
                    span({style:{fontSize:17,width:24,textAlign:'center',flexShrink:0}},getFlag(code)),
                    div({style:{flex:1,background:'#1e293b',borderRadius:999,overflow:'hidden',height:6}},
                      div({className:'bar-fill',style:{height:'100%',borderRadius:999,
                        background:'linear-gradient(90deg,#6366f1,#818cf8)',width:pct+'%',
                        boxShadow:'0 0 6px rgba(99,102,241,0.4)'}})
                    ),
                    span({style:{fontSize:12,color:'#64748b',width:58,textAlign:'right',flexShrink:0,fontWeight:500}},
                      code+' · '+pct+'%')
                  );
                })
              )
            ),

            // Demographics (only shows if enough data)
            e(DemographicBreakdown,{votes,options:question.options})
          ),

      // Card footer
      div({style:{marginTop:22,paddingTop:16,borderTop:'1px solid #1a2540',
        display:'flex',justifyContent:'space-between',alignItems:'center'}},
        span({style:{fontSize:13,fontWeight:900,letterSpacing:'-0.3px'}},
          span({style:{color:'#818cf8'}},'con'),
          span({style:{color:'#94a3b8'}},'sensus')
        ),
        span({style:{fontSize:11,color:'#334155'}},new Date().toLocaleDateString())
      )
    ),

    // ── Share buttons ──────────────────────────────────────
    div({style:{display:'flex',flexDirection:'column',gap:10}},
      e('button',{className:'btn-green',onClick:generateShareCard},'📸  Save shareable image card'),
      e('button',{className:'btn-ghost',onClick:copyLink},'🔗  Copy link to share')
    ),

    !user && div({style:{textAlign:'center',marginTop:12,fontSize:13,color:'#475569'}},
      'Sign in to unlock ',
      e('a',{href:'#/auth',style:{color:'#818cf8',fontWeight:600}},'gender & age breakdowns'),
      ' on results.'
    ),

    msg && div({style:{textAlign:'center',fontSize:13,color:'#34d399',padding:'10px 0',fontWeight:500}},msg)
  );
};
