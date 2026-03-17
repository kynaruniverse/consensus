// js/nav.js
import { e, div, span, db }       from './db.js';
import { NotificationBell }        from './notifications.js';

export const NavBar = ({ user }) =>
  e('nav', { style:{position:'fixed',top:0,left:0,right:0,zIndex:100,
    background:'rgba(2,8,23,0.88)',borderBottom:'1px solid rgba(26,37,64,0.8)',
    backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'} },
    div({ style:{maxWidth:640,margin:'0 auto',padding:'0 20px',height:58,
      display:'flex',alignItems:'center',justifyContent:'space-between'} },

      // Logo
      e('a', { href:'#/', style:{fontSize:21,fontWeight:900,letterSpacing:'-0.5px',textDecoration:'none'} },
        e('span',{style:{color:'#818cf8'}},'Spit'),
        e('span',{style:{color:'#f1f5f9'}},'fact')
      ),

      // Right side
      div({ style:{display:'flex',alignItems:'center',gap:8} },

        // Feed link
        e('a', { href:'#/feed',
          style:{fontSize:13,fontWeight:600,color:'#64748b',padding:'6px 10px',
            borderRadius:999,textDecoration:'none',transition:'color 0.15s'} },
          'Feed'
        ),

        // Dashboard — clients only
        user?.role === 'client' && e('a', { href:'#/dashboard',
          style:{fontSize:13,fontWeight:700,
            background:'linear-gradient(135deg,rgba(129,140,248,0.15),rgba(34,211,238,0.08))',
            border:'1px solid rgba(129,140,248,0.25)',
            color:'#818cf8',padding:'6px 12px',
            borderRadius:999,textDecoration:'none',transition:'all 0.15s'} },
          '📊 Dashboard'
        ),

        // Ask button
        e('a', { href:'#/post',
          style:{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'white',
            padding:'8px 16px',borderRadius:999,fontSize:13,fontWeight:700,
            textDecoration:'none',boxShadow:'0 2px 12px rgba(99,102,241,0.4)'} },
          '+ Ask'
        ),

        // Bell (signed in only) + avatar or sign in
        user
          ? div({ style:{display:'flex',alignItems:'center',gap:8} },
              e(NotificationBell, { user }),
              e('a', { href:'#/profile',
                style:{width:32,height:32,borderRadius:'50%',flexShrink:0,
                  background:'linear-gradient(135deg,#6366f1,#a78bfa)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:13,fontWeight:900,color:'white',textDecoration:'none'} },
                (user.username||user.email||'?')[0].toUpperCase()
              )
            )
          : e('a', { href:'#/auth',
              style:{fontSize:13,fontWeight:600,color:'#64748b',
                padding:'6px 10px',textDecoration:'none'} },
              'Sign in'
            )
      )
    )
  );
