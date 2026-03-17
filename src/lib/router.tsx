import { useState, useEffect } from 'react';

export type Page =
  | 'home'
  | 'feed'
  | 'post'
  | 'question'
  | 'auth'
  | 'profile'
  | 'dashboard'
  | 'leaderboard';

export type Route = {
  page: Page;
  id?: string;
};

export function useRouter(): Route {
  const parse = (): Route => {
    const h = window.location.hash.replace('#', '');
    if (h.startsWith('/q/'))      return { page: 'question',    id: h.slice(3) };
    if (h === '/post')            return { page: 'post' };
    if (h.startsWith('/feed'))    return { page: 'feed' };
    if (h === '/auth')            return { page: 'auth' };
    if (h === '/profile')         return { page: 'profile' };
    if (h === '/dashboard')       return { page: 'dashboard' };
    if (h === '/leaderboard')     return { page: 'leaderboard' };
    return { page: 'home' };
  };

  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}

export function navigate(path: string) {
  window.location.hash = path;
}
