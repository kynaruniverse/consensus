import { createClient } from '@supabase/supabase-js';
import type { Profile, Question, Vote, Comment, Notification, Category } from '../types';

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const db = createClient(supabaseUrl, supabaseAnonKey);

// ── Colour palette — acid-first, matching new design system ──
export const COLORS = [
  '#c8ff00', // acid green  (option 1)
  '#ff3c6e', // hot pink    (option 2)
  '#00c2ff', // ice blue    (option 3)
  '#ffd166', // gold        (option 4)
  '#b06fff', // purple      (option 5)
  '#ff9500', // orange      (option 6)
];

export const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
export const GENDERS    = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export const CATEGORIES: Category[] = [
  { id: 'General',   label: '🌍 General',   color: '#c8ff00' }, // acid
  { id: 'Food',      label: '🍕 Food',      color: '#ffd166' }, // gold
  { id: 'Sports',    label: '⚽ Sports',    color: '#00c2ff' }, // ice blue
  { id: 'Politics',  label: '🏛️ Politics',  color: '#ff3c6e' }, // hot pink
  { id: 'Tech',      label: '💻 Tech',      color: '#00c2ff' }, // ice blue
  { id: 'Music',     label: '🎵 Music',     color: '#b06fff' }, // purple
  { id: 'Film & TV', label: '🎬 Film & TV', color: '#ffd166' }, // gold
  { id: 'Science',   label: '🔬 Science',   color: '#00c2ff' }, // ice blue
  { id: 'Life',      label: '✨ Life',      color: '#c8ff00' }, // acid
  { id: 'Debate',    label: '🔥 Debate',    color: '#ff3c6e' }, // hot pink
];

// ── Geolocation ───────────────────────────────────────────────
let _cachedCountry: string | null = null;

export const getCountryCode = async (): Promise<string> => {
  if (_cachedCountry) return _cachedCountry;
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 2000);
    const res        = await fetch('/.netlify/edge-functions/geolocation', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data      = await res.json();
      _cachedCountry  = data.country;
      return _cachedCountry!;
    }
    const fallback     = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    const fallbackData = await fallback.json();
    _cachedCountry     = fallbackData.country_code || 'XX';
  } catch {
    _cachedCountry = 'XX';
  }
  return _cachedCountry!;
};

// ── Flag helper ───────────────────────────────────────────────
export const getFlag = (code: string): string => {
  if (!code || code === 'XX') return '🌍';
  try {
    return String.fromCodePoint(
      ...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))
    );
  } catch {
    return '🌍';
  }
};

// ── Local vote persistence ────────────────────────────────────
export const getLocalVote       = (qid: string): number | null => {
  const v = localStorage.getItem('vote_' + qid);
  return v !== null ? parseInt(v, 10) : null;
};
export const setLocalVote       = (qid: string, idx: number) =>
  localStorage.setItem('vote_' + qid, String(idx));

export const getLocalPrediction = (qid: string): number | null => {
  const v = localStorage.getItem('pred_' + qid);
  return v !== null ? parseInt(v, 10) : null;
};
export const setLocalPrediction = (qid: string, idx: number) =>
  localStorage.setItem('pred_' + qid, String(idx));

// ── Time helper ───────────────────────────────────────────────
export const timeAgo = (ts: string): string => {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
};
