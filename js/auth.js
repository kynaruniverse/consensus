// js/auth.js
import { e, div, span, p, db, AGE_RANGES, GENDERS } from './db.js';
const { useState, useEffect } = React;

// ── AuthPage ──────────────────────────────────────────────────
// Sign in/up — after success just navigate to '/'.
// app.js onAuthStateChange handles setting user state automatically.
export const AuthPage = () => {
  const [tab,      setTab]      = useState('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender,   setGender]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const signIn = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError('');
    const { error: err } = await db.auth.signInWithPassword({ email, password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    // Success — onAuthStateChange in app.js fires SIGNED_IN,
    // sets user, and we navigate home. Don't touch loading state
    // here — the component will unmount as we navigate.
    window.location.hash = '/';
  };

  const signUp = async () => {
    if (!email || !password || !username) {
      setError('Email, password and username are required.'); return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true); setError('');

    // Check username isn't taken
    const { data: existing } = await db.from('profiles')
      .select('id').eq('username', username).maybeSingle();
    if (existing) {
      setLoading(false);
      setError('That username is taken — try another.');
      return;
    }

    const { data, error: err } = await db.auth.signUp({ email, password });
    if (err) { setLoading(false); setError(err.message); return; }

    // Insert profile row
    const { error: profErr } = await db.from('profiles').insert({
      id:        data.user.id,
      username,
      age_range: ageRange || null,
      gender:    gender   || null,
    });
    if (profErr) { setLoading(false); setError(profErr.message); return; }

    if (data.session) {
      // Logged in immediately — navigate home
      window.location.hash = '/';
    } else {
      // Email confirmation required
      setLoading(false);
      setSuccess('Check your email to confirm your account, then sign in.');
      setTab('signin');
    }
  };

  const inp = { className:'input-field', style:{marginBottom:12} };

  return div({ className:'page fade-up', style:{maxWidth:480} },

    div({ style:{textAlign:'center',marginBottom:32} },
      div({ style:{fontSize:40,marginBottom:12} }, '🌍'),
      e('h1', { style:{fontSize:26,fontWeight:900,marginBottom:6} }, 'Join Spitfact'),
      p({ style:{color:'#64748b',fontSize:15} },
        'Vote, predict, and see how the world thinks.'
      )
    ),

    div({ className:'tab-bar' },
      e('button',{className:'tab-btn'+(tab==='signin'?' active':''),
        onClick:()=>{setTab('signin');setError('');setSuccess('');}}, 'Sign In'),
      e('button',{className:'tab-btn'+(tab==='signup'?' active':''),
        onClick:()=>{setTab('signup');setError('');setSuccess('');}}, 'Sign Up')
    ),

    div({ className:'card', style:{padding:24} },

      error   && div({style:{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',
        borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:14,color:'#f87171'}}, error),
      success && div({style:{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',
        borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:14,color:'#34d399'}}, success),

      tab==='signup' && e('input',{...inp,type:'text',placeholder:'Username (public)',
        value:username, onChange:ev=>setUsername(ev.target.value.replace(/\s/g,'').toLowerCase())}),

      e('input',{...inp,type:'email',placeholder:'Email address',
        value:email, onChange:ev=>setEmail(ev.target.value)}),
      e('input',{...inp,type:'password',placeholder:'Password (min 6 chars)',
        value:password, onChange:ev=>setPassword(ev.target.value)}),

      tab==='signup' && div(null,
        e('hr',{className:'divider'}),
        div({style:{fontSize:13,color:'#64748b',marginBottom:14,lineHeight:1.5}},
          '🎯  Optional: Add your age & gender to unlock demographic breakdowns on results.'
        ),
        e('select',{...inp,value:ageRange,onChange:ev=>setAgeRange(ev.target.value)},
          e('option',{value:''},'Age range (optional)'),
          ...AGE_RANGES.map(a=>e('option',{key:a,value:a},a))
        ),
        e('select',{...inp,value:gender,onChange:ev=>setGender(ev.target.value)},
          e('option',{value:''},'Gender (optional)'),
          ...GENDERS.map(g=>e('option',{key:g,value:g},g))
        )
      ),

      e('button',{
        className:'btn-primary', disabled:loading,
        onClick: tab==='signin' ? signIn : signUp,
        style:{marginTop:4}
      }, loading ? '⏳ Signing in...' : tab==='signin' ? 'Sign In' : 'Create Account'),

      div({style:{textAlign:'center',marginTop:16,fontSize:13,color:'#475569'}},
        tab==='signin'
          ? span(null,"Don't have an account? ",
              e('a',{href:'#',onClick:ev=>{ev.preventDefault();setTab('signup');setError('');},
                style:{color:'#818cf8',fontWeight:600}},'Sign up free'))
          : span(null,'Already have an account? ',
              e('a',{href:'#',onClick:ev=>{ev.preventDefault();setTab('signin');setError('');},
                style:{color:'#818cf8',fontWeight:600}},'Sign in'))
      )
    ),

    div({style:{textAlign:'center',marginTop:20}},
      e('a',{href:'#/',style:{fontSize:13,color:'#334155'}},'← Continue without account')
    )
  );
};

// ── ProfilePage ───────────────────────────────────────────────
export const ProfilePage = ({ user, onSignOut, onProfileUpdate }) => {
  const [stats,    setStats]    = useState(null);
  const [editing,  setEditing]  = useState(false);
  const [ageRange, setAgeRange] = useState(user.age_range||'');
  const [gender,   setGender]   = useState(user.gender||'');
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  useEffect(()=>{
    Promise.all([
      db.from('votes').select('id',{count:'exact'}).eq('user_id',user.id),
      db.from('questions').select('id',{count:'exact'}).eq('created_by',user.id),
    ]).then(([{count:votes},{count:questions}])=>{
      setStats({ votes:votes||0, questions:questions||0 });
    });
  },[user.id]);

  const save = async()=>{
    setSaving(true);
    const {error} = await db.from('profiles')
      .update({age_range:ageRange||null, gender:gender||null})
      .eq('id',user.id);
    setSaving(false);
    if (error) { setMsg('Save failed: '+error.message); return; }
    setEditing(false);
    setMsg('✓ Profile updated!');
    setTimeout(()=>setMsg(''),3000);
    onProfileUpdate({...user, age_range:ageRange||null, gender:gender||null});
  };

  const initial = (user.username||user.email||'?')[0].toUpperCase();

  return div({className:'page fade-up'},

    div({style:{display:'flex',alignItems:'center',gap:16,marginBottom:28}},
      div({className:'avatar'},initial),
      div(null,
        e('h1',{style:{fontSize:22,fontWeight:900}},user.username||'Anonymous'),
        p({style:{color:'#64748b',fontSize:14,marginTop:2}},user.email),
        (user.age_range||user.gender) && p({style:{color:'#475569',fontSize:13,marginTop:2}},
          [user.age_range,user.gender].filter(Boolean).join(' · ')
        )
      )
    ),

    stats && div({style:{display:'flex',gap:10,marginBottom:28}},
      div({className:'stat-card'},
        div({className:'stat-value'},stats.votes),
        div({className:'stat-label'},'Votes cast')
      ),
      div({className:'stat-card'},
        div({className:'stat-value'},stats.questions),
        div({className:'stat-label'},'Questions posted')
      )
    ),

    div({className:'card',style:{padding:20,marginBottom:12}},
      div({style:{display:'flex',justifyContent:'space-between',alignItems:'center',
        marginBottom:editing?16:0}},
        div(null,
          div({style:{fontWeight:700,fontSize:15,marginBottom:2}},'Demographics'),
          div({style:{fontSize:13,color:'#64748b'}},
            'Used for breakdowns on results. Never shown publicly.'
          )
        ),
        e('button',{
          onClick:()=>setEditing(!editing),
          style:{background:'none',border:'1px solid #243050',borderRadius:10,
            color:'#818cf8',fontSize:13,fontWeight:600,padding:'6px 14px',cursor:'pointer'}
        }, editing?'Cancel':'Edit')
      ),
      editing && div(null,
        e('select',{className:'input-field',value:ageRange,
          onChange:ev=>setAgeRange(ev.target.value),style:{marginBottom:10}},
          e('option',{value:''},'Age range (optional)'),
          ...AGE_RANGES.map(a=>e('option',{key:a,value:a},a))
        ),
        e('select',{className:'input-field',value:gender,
          onChange:ev=>setGender(ev.target.value),style:{marginBottom:14}},
          e('option',{value:''},'Gender (optional)'),
          ...GENDERS.map(g=>e('option',{key:g,value:g},g))
        ),
        e('button',{className:'btn-primary',disabled:saving,onClick:save},
          saving?'Saving...':'Save changes')
      )
    ),

    msg && div({style:{textAlign:'center',fontSize:13,color:'#34d399',padding:'8px 0'}},msg),

    e('button',{className:'btn-danger',onClick:onSignOut},'→ Sign out'),

    div({style:{textAlign:'center',marginTop:16}},
      e('a',{href:'#/',style:{fontSize:13,color:'#334155'}},'← Back to questions')
    )
  );
};
