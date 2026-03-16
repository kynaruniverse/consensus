// js/comments.js
import { e, div, span, p, db, COLORS } from './db.js';
import { createNotification } from './notifications.js';
const { useState, useEffect, useRef } = React;

// ── timeAgo ───────────────────────────────────────────────────
const timeAgo = ts => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s/60)+'m ago';
  if (s < 86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
};

// ── CommentItem ───────────────────────────────────────────────
const CommentItem = ({ comment, user, options, onDelete, onLike }) => {
  const isOwn    = user?.id === comment.user_id;
  const optColor = comment.vote_index != null ? COLORS[comment.vote_index % COLORS.length] : null;
  const optLabel = comment.vote_index != null && options ? options[comment.vote_index] : null;

  return div({ style:{
    padding:'14px 0',
    borderBottom:'1px solid #1a2540',
  }},
    // Header row
    div({ style:{display:'flex',alignItems:'center',gap:8,marginBottom:8} },

      // Avatar
      div({ style:{
        width:30,height:30,borderRadius:'50%',flexShrink:0,
        background:'linear-gradient(135deg,#6366f1,#a78bfa)',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:12,fontWeight:900,color:'white'
      }}, (comment.username||'?')[0].toUpperCase()),

      // Name + time
      div({ style:{flex:1,minWidth:0} },
        span({ style:{fontSize:13,fontWeight:700,color:'#e2e8f0'} }, comment.username),
        span({ style:{fontSize:11,color:'#334155',marginLeft:6} }, timeAgo(comment.created_at))
      ),

      // Vote badge
      optColor && span({ style:{
        fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,
        border:'1px solid '+optColor+'40',
        color:optColor,background:optColor+'15',
        whiteSpace:'nowrap',overflow:'hidden',maxWidth:90,textOverflow:'ellipsis',
        flexShrink:0
      }}, optLabel),

      // Delete own
      isOwn && e('button', {
        onClick: () => onDelete(comment.id),
        style:{background:'none',border:'none',color:'#334155',cursor:'pointer',
          fontSize:14,padding:'0 2px',lineHeight:1,flexShrink:0,transition:'color 0.15s'}
      }, '×')
    ),

    // Body
    p({ style:{fontSize:14,color:'#94a3b8',lineHeight:1.6,marginBottom:8,
      wordBreak:'break-word'} },
      comment.body
    ),

    // Like button
    e('button', {
      onClick: () => onLike(comment),
      style:{
        background:'none',border:'none',cursor:'pointer',
        display:'flex',alignItems:'center',gap:5,padding:0,
        color: comment.likedByMe ? '#f87171' : '#334155',
        fontSize:12,fontWeight:600,transition:'color 0.15s'
      }
    },
      span({style:{fontSize:14}}, comment.likedByMe ? '❤️' : '🤍'),
      comment.likes > 0 && span(null, comment.likes)
    )
  );
};

// ── CommentsSection ───────────────────────────────────────────
export const CommentsSection = ({ questionId, question, user, myVote }) => {
  const [comments,  setComments]  = useState([]);
  const [likedIds,  setLikedIds]  = useState(new Set());
  const [body,      setBody]      = useState('');
  const [posting,   setPosting]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const textRef = useRef(null);

  // Load comments + my likes
  const load = async () => {
    const [{ data: cms }, { data: lks }] = await Promise.all([
      db.from('comments').select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true }),
      user?.id
        ? db.from('comment_likes').select('comment_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] })
    ]);
    const liked = new Set((lks||[]).map(l => l.comment_id));
    setLikedIds(liked);
    setComments((cms||[]).map(c => ({ ...c, likedByMe: liked.has(c.id) })));
    setLoading(false);
  };

  useEffect(() => {
    if (!questionId) return;
    load();

    // Realtime — new comments appear instantly
    const ch = db.channel('comments:'+questionId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'comments',
        filter: 'question_id=eq.'+questionId
      }, () => load())
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'comments',
        filter: 'question_id=eq.'+questionId
      }, () => load())
      .subscribe();

    return () => db.removeChannel(ch);
  }, [questionId, user?.id]);

  const post = async () => {
    if (!body.trim() || !user) return;
    setPosting(true);
    const { error } = await db.from('comments').insert({
      question_id: questionId,
      user_id:     user.id,
      username:    user.username || user.email?.split('@')[0] || 'Anonymous',
      body:        body.trim(),
      vote_index:  myVote ?? null,
    });
    setPosting(false);
    if (error) { alert('Failed to post: '+error.message); return; }
    setBody('');
    if (textRef.current) textRef.current.style.height = 'auto';

    // Notify question owner if it's not their own question
    if (question?.created_by && question.created_by !== user.id) {
      createNotification({
        userId:       question.created_by,
        questionId:   questionId,
        questionText: question.question_text,
        totalVotes:   0, // won't trigger milestone, just comment notif
        type:         'comment',
        message:      (user.username||'Someone')+' commented on your question',
      });
    }
  };

  const deleteComment = async (id) => {
    await db.from('comments').delete().eq('id', id).eq('user_id', user.id);
  };

  const likeComment = async (comment) => {
    if (!user) return;
    if (comment.likedByMe) {
      // Unlike
      await db.from('comment_likes').delete()
        .eq('comment_id', comment.id).eq('user_id', user.id);
      await db.from('comments').update({ likes: Math.max(0, comment.likes-1) }).eq('id', comment.id);
    } else {
      // Like
      await db.from('comment_likes').insert({ comment_id: comment.id, user_id: user.id });
      await db.from('comments').update({ likes: comment.likes+1 }).eq('id', comment.id);
    }
    load();
  };

  const autoResize = ev => {
    ev.target.style.height = 'auto';
    ev.target.style.height = Math.min(ev.target.scrollHeight, 140)+'px';
  };

  return div({ style:{marginTop:32} },

    // Section header
    div({ style:{display:'flex',alignItems:'center',gap:10,marginBottom:20,
      paddingTop:24,borderTop:'1px solid #1a2540'} },
      span({ style:{fontSize:18} }, '💬'),
      e('h3', { style:{fontSize:17,fontWeight:800,color:'#f1f5f9'} },
        'Discussion'+(comments.length > 0 ? ' ('+comments.length+')' : '')
      )
    ),

    // Compose box
    user
      ? div({ style:{
          background:'#0d1424',
          border:'1px solid rgba(99,102,241,0.2)',
          borderRadius:16,padding:16,marginBottom:24
        }},
          div({ style:{display:'flex',gap:10,marginBottom:10} },
            div({ style:{
              width:28,height:28,borderRadius:'50%',flexShrink:0,
              background:'linear-gradient(135deg,#6366f1,#a78bfa)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:11,fontWeight:900,color:'white'
            }}, (user.username||'?')[0].toUpperCase()),
            e('textarea', {
              ref: textRef,
              placeholder: myVote != null
                ? 'Share your thoughts on "'+question?.options?.[myVote]+'"...'
                : 'What do you think? Join the discussion...',
              value: body,
              onChange: ev => { setBody(ev.target.value); autoResize(ev); },
              style:{
                flex:1,background:'transparent',border:'none',
                color:'#e2e8f0',fontSize:14,resize:'none',outline:'none',
                lineHeight:1.55,minHeight:40,height:40,overflow:'hidden',
                fontFamily:'inherit'
              }
            })
          ),

          div({ style:{display:'flex',justifyContent:'space-between',alignItems:'center'} },
            // Vote badge preview
            myVote != null && span({ style:{
              fontSize:11,fontWeight:600,color:COLORS[myVote%COLORS.length],
              background:COLORS[myVote%COLORS.length]+'15',
              border:'1px solid '+COLORS[myVote%COLORS.length]+'30',
              borderRadius:999,padding:'3px 9px'
            }}, 'Voted: '+((question?.options||[])[myVote]||'')),
            myVote == null && span({ style:{fontSize:11,color:'#334155'} },
              'Vote first to show your stance'),

            e('button', {
              onClick: post,
              disabled: !body.trim() || posting,
              style:{
                background: body.trim()
                  ? 'linear-gradient(135deg,#6366f1,#4f46e5)'
                  : '#1e293b',
                color: body.trim() ? 'white' : '#334155',
                border:'none',borderRadius:10,
                padding:'8px 16px',fontSize:13,fontWeight:700,
                cursor: body.trim() ? 'pointer' : 'not-allowed',
                transition:'all 0.15s',
                boxShadow: body.trim() ? '0 2px 10px rgba(99,102,241,0.3)' : 'none'
              }
            }, posting ? '...' : 'Post')
          )
        )
      : div({ style:{
          background:'rgba(99,102,241,0.04)',
          border:'1px solid rgba(99,102,241,0.15)',
          borderRadius:14,padding:'14px 18px',marginBottom:24,
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:12
        }},
          p({ style:{fontSize:14,color:'#64748b',margin:0} },
            'Sign in to join the discussion'
          ),
          e('a', { href:'#/auth', style:{
            background:'linear-gradient(135deg,#6366f1,#4f46e5)',
            color:'white',textDecoration:'none',
            borderRadius:10,padding:'8px 16px',fontSize:13,fontWeight:700,
            flexShrink:0,boxShadow:'0 2px 10px rgba(99,102,241,0.3)'
          }}, 'Sign in')
        ),

    // Comments list
    loading
      ? div({ style:{textAlign:'center',padding:'24px 0',color:'#334155'} }, 'Loading...')
      : comments.length === 0
      ? div({ style:{textAlign:'center',padding:'32px 0'} },
          div({style:{fontSize:36,marginBottom:8}},'💭'),
          p({style:{color:'#475569',fontSize:14}},'No comments yet — start the debate!')
        )
      : div(null,
          ...comments.map(c =>
            e(CommentItem, {
              key:c.id, comment:c, user, options:question?.options,
              onDelete: deleteComment,
              onLike:   likeComment
            })
          )
        )
  );
};
