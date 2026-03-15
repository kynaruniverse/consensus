// js/notifications.js
// ─────────────────────────────────────────────────────────────────
// Notification bell + dropdown. Converted to htm syntax.
// Fixes: sequential inserts → batched, aria-label added.
// ─────────────────────────────────────────────────────────────────
import { db, timeAgo } from './db.js';
const { useState, useEffect, useRef } = React;

// ── Vote milestone thresholds ─────────────────────────────────────
const MILESTONES = [10, 50, 100, 500, 1000];

// ── Create notifications after a vote ────────────────────────────
export const createNotification = async ({ userId, questionId, questionText, totalVotes }) => {
  if (!userId) return;

  const notifs = [];

  if (MILESTONES.includes(totalVotes)) {
    notifs.push({
      user_id:       userId,
      type:          'milestone',
      question_id:   questionId,
      question_text: questionText,
      message:       'Your question hit ' + totalVotes + ' votes! 🎉',
    });
  } else if (totalVotes > 0 && totalVotes % 10 === 0) {
    notifs.push({
      user_id:       userId,
      type:          'new_vote',
      question_id:   questionId,
      question_text: questionText,
      message:       totalVotes + ' people have voted on your question',
    });
  }

  // Batch insert instead of sequential awaits
  if (notifs.length > 0) {
    await db.from('notifications').insert(notifs);
  }
};

// ── Notification dropdown ─────────────────────────────────────────
const NotificationDropdown = ({ notifications, onClose, onMarkAllRead }) => {
  const ref = useRef(null);

  useEffect(() => {
    const fn = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', fn), 0);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const typeIcon  = (type) => type === 'milestone' ? '🎉' : '🗳️';
  const typeColor = (type) => type === 'milestone'
    ? 'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(249,115,22,0.2))'
    : 'rgba(99,102,241,0.15)';

  return html`
    <div ref=${ref} role="dialog" aria-label="Notifications"
      class="absolute top-[calc(100%+8px)] right-0 w-80 max-h-[420px] overflow-y-auto rounded-[18px] shadow-2xl z-[200]"
      style="background:#0d1424;border:1px solid rgba(129,140,248,0.25)">

      <!-- Header -->
      <div class="flex justify-between items-center px-4 py-3 border-b border-border1 sticky top-0"
        style="background:#0d1424">
        <span class="text-sm font-black text-slate-100">Notifications</span>
        ${notifications.some(n => !n.read) && html`
          <button onClick=${onMarkAllRead}
            class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-none border-none cursor-pointer transition-colors">
            Mark all read
          </button>
        `}
      </div>

      <!-- List -->
      ${notifications.length === 0
        ? html`
          <div class="text-center py-8 px-4">
            <div class="text-3xl mb-2">🔔</div>
            <p class="text-sm text-slate-500">No notifications yet</p>
            <p class="text-xs text-slate-600 mt-1">You'll see updates when people vote on your questions</p>
          </div>
        `
        : html`
          <div>
            ${notifications.slice(0, 20).map(n => html`
              <a key=${n.id} href=${'#/q/' + n.question_id} onClick=${onClose}
                class=${'flex gap-3 px-4 py-3 border-b border-border1 no-underline text-white transition-colors ' + (n.read ? '' : 'bg-indigo-500/[0.04]')}
                style="display:flex">
                <!-- Icon -->
                <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base"
                  style=${'background:' + typeColor(n.type)}>
                  ${typeIcon(n.type)}
                </div>
                <!-- Text -->
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-semibold text-slate-100 mb-0.5 leading-tight">${n.message}</p>
                  <p class="text-[11px] text-slate-500 truncate mb-0.5">${n.question_text}</p>
                  <span class="text-[11px] text-slate-600">${timeAgo(n.created_at)}</span>
                </div>
                <!-- Unread dot -->
                ${!n.read && html`
                  <div class="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1"
                    style="box-shadow:0 0 6px rgba(99,102,241,0.6)"></div>
                `}
              </a>
            `)}
          </div>
        `
      }

      <!-- Footer -->
      ${notifications.length > 0 && html`
        <div class="text-center py-2.5 border-t border-border1">
          <span class="text-xs text-slate-600">
            Showing last ${Math.min(notifications.length, 20)} notifications
          </span>
        </div>
      `}
    </div>
  `;
};

// ── Bell button ───────────────────────────────────────────────────
export const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [open,          setOpen]          = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const load = async () => {
    if (!user?.id) return;
    const { data } = await db.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  };

  useEffect(() => {
    if (!user?.id) return;
    load();

    const ch = db.channel('notifs:' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: 'user_id=eq.' + user.id,
      }, () => load())
      .subscribe();

    return () => db.removeChannel(ch);
  }, [user?.id]);

  const toggleOpen = async () => {
    const wasOpen = open;
    setOpen(!open);
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

  return html`
    <div class="relative">
      <button
        onClick=${toggleOpen}
        aria-label=${'Notifications' + (unread > 0 ? ', ' + unread + ' unread' : '')}
        aria-haspopup="dialog"
        aria-expanded=${open}
        class=${'relative w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-all text-[15px] border ' + (open ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-400' : 'border-indigo-400/20 bg-indigo-500/[0.06] ' + (unread > 0 ? 'text-indigo-400' : 'text-slate-500'))}
      >
        🔔
        ${unread > 0 && html`
          <div class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-[9px] font-black flex items-center justify-center px-1"
            style="box-shadow:0 0 8px rgba(99,102,241,0.6);border:1.5px solid #020817">
            ${unread > 9 ? '9+' : String(unread)}
          </div>
        `}
      </button>

      ${open && html`
        <${NotificationDropdown}
          notifications=${notifications}
          onClose=${() => setOpen(false)}
          onMarkAllRead=${markAllRead}
        />
      `}
    </div>
  `;
};
