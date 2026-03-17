import { useState, useEffect } from 'react';

export type Route = {
  page: 'home' | 'feed' | 'post' | 'question' | 'auth' | 'profile' | 'dashboard';
  id?: string;
};

export function useRouter() {
  const parse = (): Route => {
    const h = window.location.hash.replace('#', '');
    if (h.startsWith('/q/')) return { page: 'question', id: h.slice(3) };
    if (h === '/post') return { page: 'post' };
    if (h.startsWith('/feed')) return { page: 'feed' };
    if (h === '/auth') return { page: 'auth' };
    if (h === '/profile') return { page: 'profile' };
    if (h === '/dashboard') return { page: 'dashboard' };
    return { page: 'home' };
  };

  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const handleHashChange = () => setRoute(parse());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}

export function navigate(path: string) {
  window.location.hash = path;
}
