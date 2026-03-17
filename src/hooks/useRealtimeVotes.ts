import { useEffect, useState } from 'react';
import { db } from '../lib/supabase';
import type { Vote } from '../types';

export function useRealtimeVotes(questionId: string) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [liveVoters, setLiveVoters] = useState(0);

  useEffect(() => {
    if (!questionId) return;

    // Initial load
    const loadVotes = async () => {
      const { data } = await db
        .from('votes')
        .select('*')
        .eq('question_id', questionId);
      setVotes(data || []);
    };
    loadVotes();

    // Realtime subscription
    const subscription = db
      .channel(`votes:${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `question_id=eq.${questionId}`
        },
        (payload) => {
          setVotes(prev => [...prev, payload.new as Vote]);
        }
      )
      .subscribe();

    // Presence tracking (who's viewing this question)
    const presenceChannel = db.channel(`presence:${questionId}`);
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setLiveVoters(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user: 'anonymous',
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      subscription.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [questionId]);

  return { votes, liveVoters };
}
