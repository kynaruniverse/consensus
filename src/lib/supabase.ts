import { createClient } from '@supabase/supabase-js';
import type { Profile, Question, Vote, Comment, Notification, Category } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const db = createClient(supabaseUrl, supabaseAnonKey);

// Constants
export const COLORS = [
  '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8',
];

export const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export const CATEGORIES: Category[] = [
  { id: 'General', label: '🌍 General', color: '#818cf8' },
  { id: 'Food', label: '🍕 Food', color: '#f97316' },
  { id: 'Sports', label: '⚽ Sports', color: '#34d399' },
  { id: 'Politics', label: '🗳️ Politics', color: '#f87171' },
  { id: 'Tech', label: '💻 Tech', color: '#38bdf8' },
  { id: 'Music', label: '🎵 Music', color: '#a78bfa' },
  { id: 'Film & TV', label: '🎬 Film & TV', color: '#fbbf24' },
  { id: 'Science', label: '🔬 Science', color: '#10b981' },
  { id: 'Life', label: '✨ Life', color: '#e879f9' },
  { id: 'Debate', label: '🔥 Debate', color: '#ef4444' },
];

// Geolocation helper with edge function
let _cachedCountry: string | null = null;

export const getCountryCode = async (): Promise<string> => {
  if (_cachedCountry) return _cachedCountry;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    // Try edge function first
    const res = await fetch('/.netlify/edge-functions/geolocation', {
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      _cachedCountry = data.country;
      return _cachedCountry;
    }
    
    // Fallback to ipapi.co
    const fallbackRes = await fetch('https://ipapi.co/json/', {
      signal: controller.signal
    });
    const fallbackData = await fallbackRes.json();
    _cachedCountry = fallbackData.country_code || 'XX';
  } catch {
    _cachedCountry = 'XX';
  }
  return _cachedCountry;
};

// Flag helper
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

// Local storage helpers
export const getLocalVote = (questionId: string): number | null => {
  const v = localStorage.getItem('voted_' + questionId);
  return v !== null ? parseInt(v, 10) : null;
};

export const setLocalVote = (questionId: string, optionIndex: number): void => {
  localStorage.setItem('voted_' + questionId, String(optionIndex));
};

export const getLocalPrediction = (questionId: string): number | null => {
  const v = localStorage.getItem('pred_' + questionId);
  return v !== null ? parseInt(v, 10) : null;
};

export const setLocalPrediction = (questionId: string, optionIndex: number): void => {
  localStorage.setItem('pred_' + questionId, String(optionIndex));
};

// Time ago helper
export const timeAgo = (ts: string): string => {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
};
