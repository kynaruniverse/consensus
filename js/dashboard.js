// js/dashboard.js
// Client dashboard — available to users with role='client'
import { e, div, span, p, db, COLORS, CATEGORIES, getFlag } from './db.js';
const { useState, useEffect, useRef } = React;

// ── CSV export helper ─────────────────────────────────────────
const exportCSV = (question, votes) => {
  const headers = ['vote_id','option_index','option_text','country_code','age_range','gender','created_at'];
  const rows = votes.map(v => [
    v.id,
    v.option_index,
    '"'+(question.options[v.option_index]||'').replace(/"/g,'""')+'"',
    v.country_code||'',
    v.age_range||'',
    v.gender||'',
    v.created_at
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'spitfact-'+question.id.slice(0,8)+'.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};

// ── MiniBar ───────────────────────────────────────────────────
const MiniBar = ({ label, count, total, color, pct }) => {
  const p2 = total > 0 ? Math.round((count/total)*100) : 0;
  return div({ style:{marginBottom:10} },
    div({ style:{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:13} },
      span({ style:{color:'#e2e8f0',fontWeight:600,flex:1,paddingRight:8,lineHeight:1.3} }, label),
      span({ style:{color:color,fontWeight:800,flexShrink:0} }, p2+'%')
    ),
    div({ style:{background:'#1e293b',borderRadius:999,height:8,overflow:'hidden'} },
      div({ style:{height:'100%',borderRadius:999,width:p2+'%',
        background:'linear-gradient(90deg,'+color+','+color+'88)',
        boxShadow:'0 0 8px '+color+'50',
        transition:'width 0.9s cubic-bezier(0.4,0,0.2,1)'} })
    ),
    span({ style:{fontSize:11,color:'#475569',marginTop:3,display:'block'} },
      count.toLocaleString()+' votes')
  );
};

// ── QuestionDetailPanel ───────────────────────────────────────
const QuestionDetailPanel = ({ question, onClose }) => {
  const [votes,       setVotes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [filterCty,   setFilterCty]   = useState('');
  const [filterAge,   setFilterAge]   = useState('');
  const [filterGender,setFilterGender]= useState('');

  useEffect(() => {
    db.from('votes').select('*').eq('question_id', question.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setVotes(data||[]); setLoading(false); });
  }, [question.id]);

  // Apply filters
  const filtered = votes.filter(v => {
    if (dateFrom   && v.created_at < dateFrom)   return false;
    if (dateTo     && v.created_at > dateTo+'T23:59:59Z') return false;
    if (filterCty  && v.country_code !== filterCty)  return false;
    if (filterAge  && v.age_range !== filterAge)     return false;
    if (filterGender && v.gender !== filterGender)   return false;
    return true;
  });

  const total = filtered.length;

  // Country breakdown
  const byCountry = Object.entries(
    filtered.reduce((acc,v) => { const c=v.country_code||'XX'; acc[c]=(acc[c]||0)+1; return acc; }, {})
  ).sort((a,b)=>b[1]-a[1]).slice(0,10);

  // Age breakdown
  const byAge = Object.entries(
    filtered.filter(v=>v.age_range).reduce((acc,v) => { acc[v.age_range]=(acc[v.age_range]||0)+1; return acc; }, {})
  ).sort((a,b)=>b[1]-a[1]);

  // Gender breakdown
  const byGender = Object.entries(
    filtered.filter(v=>v.gender).reduce((acc,v) => { acc[v.gender]=(acc[v.gender]||0)+1; return acc; }, {})
  ).sort((a,b)=>b[1]-a[1]);

  const inp = { className:'input-field', style:{fontSize:12,padding:'8px 10px'} };

  return div({ style:{
    position:'fixed',inset:0,zIndex:300,
    background:'rgba(2,8,23,0.95)',
    backdropFilter:'blur(8px)',overflowY:'auto',padding:'16px'
  }},
    div({ style:{maxWidth:680,margin:'0 auto',paddingBottom:80} },

      // Header
      div({ style:{display:'flex',alignItems:'flex-start',gap:12,marginBottom:24,paddingTop:8} },
        e('button', { onClick:onClose,
          style:{background:'none',border:'1px solid #1a2540',color:'#64748b',borderRadius:10,
            padding:'6px 12px',cursor:'pointer',fontSize:13,fontWeight:600,flexShrink:0,marginTop:2} },
          '← Back'
        ),
        div(null,
          e('h2', { style:{fontSize:20,fontWeight:900,color:'#f1f5f9',letterSpacing:'-0.3px',lineHeight:1.3,marginBottom:4} },
            question.question_text
          ),
          span({ style:{fontSize:12,color:'#475569'} },
            votes.length.toLocaleString()+' total votes · '+
            new Date(question.created_at).toLocaleDateString()
          )
        )
      ),

      // Filters row
      div({ style:{
        background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,
        padding:'16px',marginBottom:24
      }},
        div({ style:{fontSize:12,fontWeight:700,color:'#475569',textTransform:'uppercase',
          letterSpacing:'0.08em',marginBottom:12} }, 'Filters'),
        div({ style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8} },
          e('input', { ...inp, type:'date', value:dateFrom,
            onChange:ev=>setDateFrom(ev.target.value), placeholder:'From date' }),
          e('input', { ...inp, type:'date', value:dateTo,
            onChange:ev=>setDateTo(ev.target.value), placeholder:'To date' })
        ),
        div({ style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8} },
          e('input', { ...inp, type:'text', value:filterCty, placeholder:'Country (e.g. GB)',
            onChange:ev=>setFilterCty(ev.target.value.toUpperCase()) }),
          e('select', { ...inp, value:filterAge, onChange:ev=>setFilterAge(ev.target.value) },
            e('option',{value:''},'All ages'),
            ...['Under 18','18–24','25–34','35–44','45–54','55+'].map(a =>
              e('option',{key:a,value:a},a))
          ),
          e('select', { ...inp, value:filterGender, onChange:ev=>setFilterGender(ev.target.value) },
            e('option',{value:''},'All genders'),
            ...['Male','Female','Non-binary','Prefer not to say'].map(g =>
              e('option',{key:g,value:g},g))
          )
        ),
        div({ style:{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'} },
          span({ style:{fontSize:13,color:'#64748b'} },
            total.toLocaleString()+' votes match filters'
          ),
          e('button', {
            onClick: () => exportCSV(question, filtered),
            style:{background:'linear-gradient(135deg,#059669,#047857)',color:'white',
              border:'none',borderRadius:10,padding:'8px 16px',fontSize:13,fontWeight:700,
              cursor:'pointer',boxShadow:'0 2px 10px rgba(5,150,105,0.35)'}
          }, '⬇ Export CSV')
        )
      ),

      loading
        ? div({ style:{textAlign:'center',padding:48,color:'#334155'} }, 'Loading data...')
        : total === 0
        ? div({ style:{textAlign:'center',padding:48,color:'#334155'} },
            div({style:{fontSize:36,marginBottom:8}},'📊'),
            p({style:{color:'#475569'}},'No votes match your filters')
          )
        : div(null,

          // Option results
          div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:20,marginBottom:16} },
            div({ style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',
              letterSpacing:'0.1em',marginBottom:16} }, 'Results'),
            ...question.options.map((opt,i) =>
              e(MiniBar,{key:i,label:opt,
                count:filtered.filter(v=>v.option_index===i).length,
                total,color:COLORS[i%COLORS.length]})
            )
          ),

          // Country + demo row
          div({ style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16} },

            // By country
            byCountry.length > 0 && div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:20} },
              div({ style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',
                letterSpacing:'0.1em',marginBottom:14} }, '🌍 By Country'),
              div({ style:{display:'flex',flexDirection:'column',gap:8} },
                ...byCountry.map(([code,count]) => {
                  const pct = Math.round((count/total)*100);
                  return div({ key:code, style:{display:'flex',alignItems:'center',gap:8} },
                    span({style:{fontSize:16,width:22,textAlign:'center',flexShrink:0}},getFlag(code)),
                    div({style:{flex:1,background:'#1e293b',borderRadius:999,overflow:'hidden',height:6}},
                      div({style:{height:'100%',borderRadius:999,background:'linear-gradient(90deg,#6366f1,#818cf8)',
                        width:pct+'%',transition:'width 0.8s ease'}})
                    ),
                    span({style:{fontSize:11,color:'#64748b',width:52,textAlign:'right',flexShrink:0,fontWeight:600}},
                      code+' '+pct+'%')
                  );
                })
              )
            ),

            // By age + gender
            div({ style:{display:'flex',flexDirection:'column',gap:12} },
              byAge.length > 0 && div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:20} },
                div({ style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',
                  letterSpacing:'0.1em',marginBottom:12} }, '📊 By Age'),
                ...byAge.map(([age,count]) => {
                  const pct = Math.round((count/total)*100);
                  return div({ key:age, style:{display:'flex',alignItems:'center',gap:8,marginBottom:6} },
                    span({style:{fontSize:11,color:'#64748b',width:56,flexShrink:0}}),
                    span({style:{fontSize:12,color:'#94a3b8',flex:1}}),
                    div({key:age,style:{width:'100%',marginBottom:6}},
                      div({style:{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}},
                        span({style:{color:'#94a3b8'}}),age,
                        span({style:{color:'#818cf8',fontWeight:700}},pct+'%')
                      ),
                      div({style:{background:'#1e293b',borderRadius:999,overflow:'hidden',height:5}},
                        div({style:{height:'100%',borderRadius:999,background:'#818cf8',width:pct+'%',transition:'width 0.8s ease'}})
                      )
                    )
                  );
                }),
                ...byAge.map(([age,count]) => {
                  const pct = Math.round((count/total)*100);
                  return div({key:age+'bar',style:{marginBottom:6}},
                    div({style:{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}},
                      span({style:{color:'#94a3b8'}}),age,
                      span({style:{color:'#818cf8',fontWeight:700}},pct+'%')
                    ),
                    div({style:{background:'#1e293b',borderRadius:999,overflow:'hidden',height:5}},
                      div({style:{height:'100%',borderRadius:999,background:'#818cf8',
                        width:pct+'%',transition:'width 0.8s ease'}})
                    )
                  );
                })
              ),
              byGender.length > 0 && div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:20} },
                div({ style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',
                  letterSpacing:'0.1em',marginBottom:12} }, '👤 By Gender'),
                ...byGender.map(([gender,count]) => {
                  const pct = Math.round((count/total)*100);
                  return div({key:gender,style:{marginBottom:6}},
                    div({style:{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}},
                      span({style:{color:'#94a3b8'}}),gender,
                      span({style:{color:'#34d399',fontWeight:700}},pct+'%')
                    ),
                    div({style:{background:'#1e293b',borderRadius:999,overflow:'hidden',height:5}},
                      div({style:{height:'100%',borderRadius:999,background:'#34d399',
                        width:pct+'%',transition:'width 0.8s ease'}})
                    )
                  );
                })
              )
            )
          ),

          // Raw data preview
          div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:20} },
            div({ style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14} },
              div({ style:{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em'} },
                'Recent Votes (preview)'
              ),
              span({ style:{fontSize:12,color:'#334155'} }, 'Full data via CSV export')
            ),
            div({ style:{overflowX:'auto'} },
              e('table', { style:{width:'100%',borderCollapse:'collapse',fontSize:12} },
                e('thead', null,
                  e('tr', null,
                    ...['Option','Country','Age','Gender','Time'].map(h =>
                      e('th',{key:h,style:{textAlign:'left',padding:'6px 8px',color:'#475569',
                        fontWeight:600,borderBottom:'1px solid #1a2540',whiteSpace:'nowrap'}},h)
                    )
                  )
                ),
                e('tbody', null,
                  ...filtered.slice(0,15).map((v,i) =>
                    e('tr',{key:v.id,style:{borderBottom:'1px solid rgba(26,37,64,0.5)'}},
                      e('td',{style:{padding:'7px 8px',color:'#e2e8f0'}},
                        question.options[v.option_index]?.slice(0,24)||(v.option_index+'')),
                      e('td',{style:{padding:'7px 8px',color:'#94a3b8'}},
                        div({style:{display:'flex',alignItems:'center',gap:4}},
                          span({style:{fontSize:13}}),getFlag(v.country_code),
                          v.country_code||'—')),
                      e('td',{style:{padding:'7px 8px',color:'#94a3b8'}},v.age_range||'—'),
                      e('td',{style:{padding:'7px 8px',color:'#94a3b8'}},v.gender||'—'),
                      e('td',{style:{padding:'7px 8px',color:'#475569',whiteSpace:'nowrap'}},
                        new Date(v.created_at).toLocaleDateString())
                    )
                  )
                )
              )
            )
          )
        )
    )
  );
};

// ── DashboardPage ─────────────────────────────────────────────
export const DashboardPage = ({ user }) => {
  const [questions,   setQuestions]   = useState([]);
  const [voteCounts,  setVoteCounts]  = useState({});
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [sortBy,      setSortBy]      = useState('votes');  // 'votes'|'new'|'mine'
  const [selected,    setSelected]    = useState(null);
  const [totalVotes,  setTotalVotes]  = useState(0);
  const [totalCountries, setTotalCountries] = useState(0);

  useEffect(() => {
    Promise.all([
      db.from('questions').select('*').order('created_at',{ascending:false}),
      db.from('votes').select('question_id,country_code')
    ]).then(([{data:qs},{data:vs}]) => {
      setQuestions(qs||[]);
      setTotalVotes((vs||[]).length);
      const countries = new Set((vs||[]).map(v=>v.country_code).filter(Boolean));
      setTotalCountries(countries.size);
      const counts = (vs||[]).reduce((a,v)=>{ a[v.question_id]=(a[v.question_id]||0)+1; return a; },{});
      setVoteCounts(counts);
      setLoading(false);
    });
  }, []);

  const filtered = questions
    .filter(q => !search || q.question_text.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sortBy==='votes') return (voteCounts[b.id]||0)-(voteCounts[a.id]||0);
      if (sortBy==='mine')  return (b.created_by===user?.id?1:0)-(a.created_by===user?.id?1:0);
      return 0; // 'new' already sorted from DB
    });

  if (selected) return e(QuestionDetailPanel, {
    question: selected,
    onClose: () => setSelected(null)
  });

  return div({ style:{minHeight:'100vh',background:'#020817',paddingTop:58}, className:'page-in' },
    div({ style:{maxWidth:720,margin:'0 auto',padding:'32px 16px 80px'} },

      // Header
      div({ style:{marginBottom:32} },
        div({ style:{display:'flex',alignItems:'center',gap:10,marginBottom:6} },
          span({ style:{fontSize:28} }, '📊'),
          e('h1', { style:{fontSize:26,fontWeight:900,letterSpacing:'-0.5px',color:'#f1f5f9'} },
            'Client Dashboard'
          )
        ),
        p({ style:{color:'#64748b',fontSize:14} },
          'Real-time opinion data from around the world. Filter, analyse, and export.'
        )
      ),

      // Stats strip
      !loading && div({ style:{
        display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:28
      }},
        ...([
          { val:questions.length, label:'Questions', color:'#818cf8', icon:'❓' },
          { val:totalVotes,       label:'Total Votes', color:'#22d3ee', icon:'🗳️' },
          { val:totalCountries,   label:'Countries',   color:'#e879f9', icon:'🌍' },
        ]).map(s =>
          div({ key:s.label, style:{
            background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,
            padding:'18px 16px',textAlign:'center'
          }},
            div({style:{fontSize:22,marginBottom:4}}),s.icon,
            div({style:{fontSize:24,fontWeight:900,color:s.color,letterSpacing:'-1px',lineHeight:1}}),
            s.val.toLocaleString(),
            div({style:{fontSize:11,color:'#475569',marginTop:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}),
            s.label
          )
        ),
        div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:'18px 16px',textAlign:'center'} },
          div({style:{fontSize:22,marginBottom:4}},'❓'),
          div({style:{fontSize:24,fontWeight:900,color:'#818cf8',letterSpacing:'-1px',lineHeight:1}},
            questions.length.toLocaleString()),
          div({style:{fontSize:11,color:'#475569',marginTop:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}},
            'Questions')
        ),
        div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:'18px 16px',textAlign:'center'} },
          div({style:{fontSize:22,marginBottom:4}},'🗳️'),
          div({style:{fontSize:24,fontWeight:900,color:'#22d3ee',letterSpacing:'-1px',lineHeight:1}},
            totalVotes.toLocaleString()),
          div({style:{fontSize:11,color:'#475569',marginTop:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}},
            'Total Votes')
        ),
        div({ style:{background:'#0d1424',border:'1px solid #1a2540',borderRadius:16,padding:'18px 16px',textAlign:'center'} },
          div({style:{fontSize:22,marginBottom:4}},'🌍'),
          div({style:{fontSize:24,fontWeight:900,color:'#e879f9',letterSpacing:'-1px',lineHeight:1}},
            totalCountries.toLocaleString()),
          div({style:{fontSize:11,color:'#475569',marginTop:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}},
            'Countries')
        )
      ),

      // Search + sort
      div({ style:{display:'flex',gap:10,marginBottom:20,alignItems:'center'} },
        e('input', { className:'input-field', type:'text',
          placeholder:'Search questions...',
          value:search, onChange:ev=>setSearch(ev.target.value),
          style:{flex:1,fontSize:14}
        }),
        e('select', { className:'input-field', value:sortBy,
          onChange:ev=>setSortBy(ev.target.value),
          style:{width:130,fontSize:13}
        },
          e('option',{value:'votes'},'Most votes'),
          e('option',{value:'new'},'Newest'),
          e('option',{value:'mine'},'My polls first')
        )
      ),

      // Questions table
      loading
        ? div({style:{display:'flex',flexDirection:'column',gap:8}},
            ...[1,2,3,4].map(i=>div({key:i,className:'skeleton',style:{height:68}})))
        : filtered.length === 0
        ? div({style:{textAlign:'center',padding:'48px 0',color:'#334155'}},
            div({style:{fontSize:40,marginBottom:8}},'🔍'),
            p({style:{color:'#475569'}},'No questions match your search')
          )
        : div({style:{display:'flex',flexDirection:'column',gap:8}},
            ...filtered.map(q => {
              const vc = voteCounts[q.id]||0;
              const isOwn = q.created_by === user?.id;
              const cat = CATEGORIES.find(c=>c.id===q.category);
              return e('button', {
                key:q.id,
                onClick:()=>setSelected(q),
                style:{
                  display:'block',width:'100%',textAlign:'left',
                  background:'#0d1424',border:'1px solid '+(isOwn?'rgba(99,102,241,0.3)':'#1a2540'),
                  borderRadius:14,padding:'14px 16px',cursor:'pointer',
                  transition:'all 0.15s',color:'white'
                }
              },
                div({style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}},
                  div({style:{flex:1,minWidth:0}},
                    div({style:{display:'flex',alignItems:'center',gap:6,marginBottom:5}},
                      isOwn && span({style:{fontSize:10,fontWeight:700,color:'#818cf8',
                        background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.25)',
                        borderRadius:999,padding:'1px 7px'}},'YOUR POLL'),
                      cat && span({style:{fontSize:10,fontWeight:600,color:cat.color,
                        background:cat.color+'15',border:'1px solid '+cat.color+'30',
                        borderRadius:999,padding:'1px 7px'}}),cat?.label
                    ),
                    p({style:{fontSize:14,fontWeight:600,color:'#f1f5f9',lineHeight:1.4,
                      overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',margin:0}},
                      q.question_text)
                  ),
                  div({style:{textAlign:'right',flexShrink:0}},
                    div({style:{fontSize:20,fontWeight:900,color:'#818cf8',lineHeight:1}},
                      vc.toLocaleString()),
                    div({style:{fontSize:10,color:'#475569',marginTop:2}},'votes'),
                    div({style:{fontSize:11,color:'#334155',marginTop:4}},
                      new Date(q.created_at).toLocaleDateString())
                  )
                )
              );
            })
          ),

      // Upgrade prompt if not client
      user && user.role !== 'client' && div({
        style:{marginTop:32,background:'rgba(99,102,241,0.06)',
          border:'1px solid rgba(99,102,241,0.2)',borderRadius:16,padding:24,textAlign:'center'}
      },
        div({style:{fontSize:32,marginBottom:10}},'⚡'),
        e('h3',{style:{fontSize:18,fontWeight:800,marginBottom:8,color:'#f1f5f9'}},
          'You\'re viewing as a standard user'),
        p({style:{color:'#64748b',fontSize:14,marginBottom:16}},
          'Upgrade to Client to unlock unlimited CSV exports, advanced date filters, and priority data access.'),
        e('a',{href:'#/profile',style:{
          display:'inline-block',background:'linear-gradient(135deg,#6366f1,#4f46e5)',
          color:'white',padding:'10px 24px',borderRadius:999,fontSize:14,
          fontWeight:700,textDecoration:'none',boxShadow:'0 4px 16px rgba(99,102,241,0.35)'}},
          'Upgrade to Client →')
      )
    )
  );
};
