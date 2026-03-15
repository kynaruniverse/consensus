// js/post.js
import { e, div, p, db, COLORS, CATEGORIES } from './db.js';
const { useState } = React;

export const PostPage = ({ user }) => {
  const [question, setQuestion] = useState('');
  const [options,  setOptions]  = useState(['','']);
  const [category, setCategory] = useState('General');
  const [posting,  setPosting]  = useState(false);

  const post = async () => {
    const valid = options.filter(o=>o.trim()!=='');
    if (!question.trim() || valid.length < 2) {
      alert('Add a question and at least 2 options.'); return;
    }
    setPosting(true);
    const payload = { question_text:question.trim(), options:valid, category };
    if (user) payload.created_by = user.id;
    const { data, error } = await db.from('questions').insert(payload).select().single();
    setPosting(false);
    if (error) { alert('Error: '+error.message); return; }
    window.location.hash = '/q/'+data.id;
  };

  const selectedCat = CATEGORIES.find(c=>c.id===category);

  return div({ className:'page fade-up' },

    div({ style:{marginBottom:28} },
      e('h2',{style:{fontSize:28,fontWeight:900,letterSpacing:'-0.5px',marginBottom:6}},'Ask the world'),
      p({style:{color:'#64748b',fontSize:15,lineHeight:1.5}},
        'Post your question and watch votes come in live from around the globe.')
    ),

    div({ className:'card', style:{padding:24} },

      // Question
      div({ style:{marginBottom:18} },
        div({className:'label'},'Your question'),
        e('textarea',{
          className:'input-field',
          placeholder:'e.g. Is a hotdog a sandwich? · Who is the GOAT? · Pineapple on pizza?',
          value:question, onChange:ev=>setQuestion(ev.target.value),
          style:{height:100,resize:'none',fontSize:16,lineHeight:1.5}
        })
      ),

      // Category picker
      div({ style:{marginBottom:18} },
        div({className:'label'},'Category'),
        div({ style:{display:'flex',flexWrap:'wrap',gap:8} },
          ...CATEGORIES.map(cat =>
            e('button',{
              key:cat.id,
              onClick:()=>setCategory(cat.id),
              style:{
                padding:'7px 14px',borderRadius:999,border:'1px solid',
                fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.15s',
                borderColor: category===cat.id ? cat.color : '#243050',
                background:  category===cat.id ? cat.color+'22' : 'transparent',
                color:       category===cat.id ? cat.color : '#64748b',
              }
            }, cat.label)
          )
        )
      ),

      // Options
      div({ style:{marginBottom:18} },
        div({className:'label'},'Options (2–4)'),
        div({ style:{display:'flex',flexDirection:'column',gap:8} },
          ...options.map((opt,i)=>
            div({key:i,style:{display:'flex',alignItems:'center',gap:8}},
              div({style:{width:28,height:28,borderRadius:'50%',flexShrink:0,
                background:COLORS[i%COLORS.length]+'20',color:COLORS[i%COLORS.length],
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800}},i+1),
              e('input',{type:'text',className:'input-field',
                placeholder:'Option '+(i+1)+(i<2?' (required)':'  (optional)'),
                value:opt,style:{flex:1},
                onChange:ev=>{ const n=[...options];n[i]=ev.target.value;setOptions(n); }}),
              options.length>2 && e('button',{
                onClick:()=>setOptions(options.filter((_,j)=>j!==i)),
                style:{background:'none',border:'none',color:'#475569',fontSize:22,
                  padding:'0 2px',lineHeight:1,flexShrink:0,cursor:'pointer'}},'×')
            )
          )
        )
      ),

      options.length<4 && e('button',{
        onClick:()=>setOptions([...options,'']),
        style:{background:'none',border:'none',color:'#6366f1',fontSize:13,
          fontWeight:600,padding:'0 0 18px',display:'block',cursor:'pointer'}
      },'+ Add another option'),

      e('button',{className:'btn-primary',onClick:post,disabled:posting},
        posting?'⏳ Posting...':'🌍  Post to the World'),

      !user && div({style:{marginTop:14,textAlign:'center',fontSize:13,color:'#475569'}},
        'Posting anonymously. ',
        e('a',{href:'#/auth',style:{color:'#818cf8',fontWeight:600}},'Sign in'),
        ' to track your questions.'
      )
    )
  );
};
