import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  user_id: string;
  type: 'milestone' | 'comment' | 'new_vote';
  question_id: string;
  question_text: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Show toast notification
  const showNotificationToast = (notif: Notification) => {
    const icon =
      notif.type === 'milestone' ? '🎉' :
      notif.type === 'comment' ? '💬' : '🗳️';

    toast.custom(
      (t: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            background: 'linear-gradient(145deg, #2A2723, #1C1A17)',
            border: '1px solid rgba(184, 124, 74, 0.3)',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.6)',
            maxWidth: '340px',
          }}
          onClick={() => {
            toast.dismiss(t.id);
            window.location.hash = `/q/${notif.question_id}`;
          }}
        >
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: '2px'
            }}>
              {notif.message}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#9CA3AF'
            }}>
              Tap to view poll
            </div>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  };

  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      setLoading(true);
      const { data } = await db
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.read).length || 0);
      setLoading(false);
    };

    loadNotifications();

    const subscription = db
      .channel('notifications:' + userId)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          if (!newNotif.read) {
            setUnreadCount(prev => prev + 1);
            showNotificationToast(newNotif);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    await db.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await db.from('notifications').update({ read: true }).eq('user_id', userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
}
