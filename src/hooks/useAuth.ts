import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import type { Profile } from '../types';

export function useAuth() {
  const [user, setUser]         = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const buildProfile = (id: string, p: any): Profile => ({
    id,
    username:  p.username,
    age_range: p.age_range,
    gender:    p.gender,
    role:      p.role || 'user',
  });

  useEffect(() => {
    // Initial session check
    db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        db.from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) setUser(buildProfile(session.user.id, p));
          });
      }
      setAuthReady(true);
    });

    // Listen for sign-in / sign-out
    const { data: { subscription } } = db.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: p } = await db
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (p) setUser(buildProfile(session.user.id, p));
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await db.auth.signOut();
    setUser(null);
  };

  const updateUser = (updated: Profile) => setUser(updated);

  return { user, authReady, signOut, updateUser };
}
