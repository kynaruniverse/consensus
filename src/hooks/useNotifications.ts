import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { db } from '../lib/supabase';
import type { Profile } from '../types';

const POLL_INTERVAL_MS = 45_000; // check every 45s

export function useNotifications(user: Profile | null) {
  const seenIds = useRef<Set<string>>(new Set());
  const timer   = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    if (!user?.id) return;

    const { data } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!data?.length) return;

    for (const notif of data) {
      if (seenIds.current.has(notif.id)) continue;
      seenIds.current.add(notif.id);

      const icon =
        notif.type === 'milestone' ? '🏆' :
        notif.type === 'comment'   ? '💬' : '🗳️';

      toast(
        (t) => (
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              cursor: 'pointer',
            }}
            onClick={() => {
              toast.dismiss(t.id);
              window.location.hash = `/q/${notif.question_id}`;
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{
                fontFamily: 'Poppins, sans-serif', fontSize: 13,
                fontWeight: 600, color: '#F5F5F5', marginBottom: 2,
              }}>
                {notif.message}
              </div>
              <div style={{ fontSize: 11, color: '#8A9BB8' }}>
                Tap to view poll
              </div>
            </div>
          </div>
        ),
        {
          duration: 6000,
          style: {
            background: 'linear-gradient(145deg, #162E54, #0F2244)',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 12,
            color: '#F5F5F5',
            maxWidth: 340,
            padding: '12px 16px',
          },
          iconTheme: { primary: '#D4AF37', secondary: '#0B1E3D' },
        }
      );

      // Mark as read in background
      db.from('notifications').update({ read: true }).eq('id', notif.id);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Initial check on mount
    check();

    // Polling interval
    timer.current = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [user?.id]);
}
