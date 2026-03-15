// js/notifications.js
import { e, div, span, p, db } from './db.js';
const { useState, useEffect, useRef } = React;

// ── Milestones that trigger a notification ────────────────────
const MILESTONES = [10, 50, 100, 500, 1000];

// ── createNotification ────────────────────────────────────────
// Called from question.js after a vote lands on someone else's question
export const createNotification = async ({ userId, questionId, questionText, totalVotes }) => {
  if (!userId) return;

  const notifs = [];

  // Milestone notifications
  if (MILESTONES.includes(totalVotes)) {
    notifs.push({
      user_id:       userId,
      type:          'milestone',
      question_id:   questionId,
      question_text: questionText,
      message:       'Your question hit '+totalVotes+' votes! 🎉',
    });
  }

  // Every 10th vote (but not milestones to avoid double)
  if (totalVotes > 0 && totalVotes % 10 === 0 && !MILESTONES.includes(totalVotes)) {
    notifs.push({
      user_id:       userId,
      type:          'new_vote',
      question_id:   questionId,
      question_text: questionText,
      message:       totalVotes+' people have voted on your question',
    });
  }

  for (const n of notifs) {
    await db.from('notifications').insert(n);
  }
};

// ── timeAgo ───────────────────────────────────────────────────
const timeAgo = (ts) => {
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (secs < 60)  return 'just now';
  if (secs < 3600) return Math.floor(secs/60)+'m ago';
  if (secs < 86400) return Math.floor(secs/3600)+'h ago';
  return Math.floor(secs/86400)+'d ago';
};

// ── NotifIcon ─────────────────────────────────────────────────
const typeIcon = (type) => type === 'milestone' ? '🎉' : '🗳️';

// ── NotificationDropdown ──────────────────────────────────────
const NotificationDropdown = ({ notifications, onClose, onMarkAllRead }) => {
  // Close on outside click
  const ref = useRef(null);
  useEffect(() => {
    const fn = (ev) => { if (ref.current && !ref.current.contains(ev.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', fn), 0);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return div({ ref, style:{
    position:'absolute', top:'calc(100% + 8px)', right:0,
    width:320, maxHeight:420, overflowY:'auto',
    background:'#0d1424',
    border:'1px solid rgba(129,140,248,0.25)',
    borderRadius:18, boxShadow:'0 16px 48px rgba(0,0,0,0.5)',
    zIndex:200,
  }},
    // Header
    div({ style:{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'14px 16px 10px', borderBottom:'1px solid #1a2540'
    }},
      span({ style:{fontSize:14,fontWeight:800,color:'#f1f5f9'} }, 'Notifications'),
      notifications.some(n=>!n.read) && e('button', {
        onClick: onMarkAllRead,
        style:{background:'none',border:'none',color:'#818cf8',fontSize:12,
          fontWeight:600,cursor:'pointer',padding:0}
      }, 'Mark all read')
    ),

    // List
    notifications.length === 0
      ? div({ style:{textAlign:'center',padding:'32px 16px',color:'#334155'} },
          div({style:{fontSize:32,marginBottom:8}},'🔔'),
          p({style:{fontSize:14,color:'#475569'}},'No notifications yet'),
          p({style:{fontSize:12,color:'#334155',marginTop:4}},
            'You\'ll see updates when people vote on your questions')
        )
      : div(null,
          ...notifications.slice(0,20).map(n =>
            e('a', {
              key:n.id,
              href:'#/q/'+n.question_id,
              onClick: onClose,
              style:{
                display:'flex', gap:12, padding:'12px 16px',
                borderBottom:'1px solid #1a2540',
                textDecoration:'none', color:'white',
                background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                transition:'background 0.15s',
              }
            },
              // Icon
              div({ style:{
                width:36, height:36, borderRadius:'50%', flexShrink:0,
                background: n.type==='milestone'
                  ? 'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(249,115,22,0.2))'
                  : 'rgba(99,102,241,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:16
              }}, typeIcon(n.type)),

              // Text
              div({ style:{flex:1,minWidth:0} },
                p({ style:{fontSize:13,fontWeight:600,color:'#f1f5f9',
                  marginBottom:3,lineHeight:1.4} }, n.message),
                p({ style:{fontSize:11,color:'#475569',
                  overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',
                  marginBottom:3} }, n.question_text),
                span({ style:{fontSize:11,color:'#334155'} }, timeAgo(n.created_at))
              ),

              // Unread dot
              !n.read && div({ style:{
                width:7, height:7, borderRadius:'50%',
                background:'#6366f1', flexShrink:0, marginTop:4,
                boxShadow:'0 0 6px rgba(99,102,241,0.6)'
              }})
            )
          )
        ),

    // Footer
    notifications.length > 0 && div({ style:{
      padding:'10px 16px', borderTop:'1px solid #1a2540', textAlign:'center'
    }},
      span({ style:{fontSize:12,color:'#334155'} },
        'Showing last '+Math.min(notifications.length,20)+' notifications'
      )
    )
  );
};

// ── NotificationBell ──────────────────────────────────────────
// Drop this into the NavBar when user is signed in
export const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [open,          setOpen]          = useState(false);
  const unread = notifications.filter(n=>!n.read).length;

  // Load notifications
  const load = async () => {
    if (!user?.id) return;
    const { data } = await db.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data||[]);
  };

  useEffect(() => {
    if (!user?.id) return;
    load();

    // Realtime — badge updates instantly when a new notification is inserted
    const ch = db.channel('notifs:'+user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: 'user_id=eq.'+user.id
      }, () => load())
      .subscribe();

    return () => db.removeChannel(ch);
  }, [user?.id]);

  const toggleOpen = async () => {
    const wasOpen = open;
    setOpen(!open);
    // Mark all as read when opening
    if (!wasOpen && unread > 0) {
      await db.from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markAllRead = async () => {
    await db.from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return div({ style:{position:'relative'} },
    // Bell button
    e('button', {
      onClick: toggleOpen,
      style:{
        position:'relative', width:34, height:34, borderRadius:'50%',
        border:'1px solid '+(open?'rgba(129,140,248,0.5)':'rgba(129,140,248,0.2)'),
        background: open ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.06)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', transition:'all 0.15s', fontSize:15,
        color: unread > 0 ? '#818cf8' : '#64748b'
      }
    },
      '🔔',
      // Unread badge
      unread > 0 && div({ style:{
        position:'absolute', top:-3, right:-3,
        minWidth:16, height:16, borderRadius:999,
        background:'linear-gradient(135deg,#6366f1,#4f46e5)',
        color:'white', fontSize:9, fontWeight:900,
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'0 4px', boxShadow:'0 0 8px rgba(99,102,241,0.6)',
        border:'1.5px solid #020817'
      }}, unread > 9 ? '9+' : String(unread))
    ),

    // Dropdown
    open && e(NotificationDropdown, {
      notifications,
      onClose: () => setOpen(false),
      onMarkAllRead: markAllRead
    })
  );
};
