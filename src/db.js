// js/db.js
// ─────────────────────────────────────────────────────────────────
// Single source of truth for: Supabase client, constants, helpers
// NOTE: Move SUPABASE_URL and SUPABASE_ANON_KEY to Netlify env vars
//       when you switch to a desktop/Vite setup.
// ─────────────────────────────────────────────────────────────────

// ── Supabase client ───────────────────────────────────────────────
export const db = supabase.createClient(
  'https://nxwublmqbysqboadwqav.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54d3VibG1xYnlzcWJvYWR3cWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDY1MzEsImV4cCI6MjA4OTA4MjUzMX0.mD24igp7ccd_y70Up3Pq-8pEBI7Y7lXjg160bvBLM8E'
);

// ── Design tokens (match Tailwind config in index.html) ───────────
export const COLORS = [
  '#818cf8', // indigo-light
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f87171', // red
  '#a78bfa', // violet
  '#38bdf8', // sky
];

// ── User profile constants ────────────────────────────────────────
export const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
export const GENDERS    = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

// ── Question categories ───────────────────────────────────────────
export const CATEGORIES = [
  { id: 'General',   label: '🌍 General',   color: '#818cf8' },
  { id: 'Food',      label: '🍕 Food',      color: '#f97316' },
  { id: 'Sports',    label: '⚽ Sports',    color: '#34d399' },
  { id: 'Politics',  label: '🗳️ Politics',  color: '#f87171' },
  { id: 'Tech',      label: '💻 Tech',      color: '#38bdf8' },
  { id: 'Music',     label: '🎵 Music',     color: '#a78bfa' },
  { id: 'Film & TV', label: '🎬 Film & TV', color: '#fbbf24' },
  { id: 'Science',   label: '🔬 Science',   color: '#10b981' },
  { id: 'Life',      label: '✨ Life',      color: '#e879f9' },
  { id: 'Debate',    label: '🔥 Debate',    color: '#ef4444' },
];

// ── Geolocation (with fallback — replaces raw ipapi.co call) ──────
// Uses ipapi.co but with a 3-second timeout and graceful fallback.
// TODO (desktop): Replace with a Netlify Edge Function that reads
//                 the CF-IPCountry header — free, no rate limits.
let _cachedCountry = null;

export const getCountryCode = async () => {
  if (_cachedCountry) return _cachedCountry;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res  = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    _cachedCountry = data.country_code || 'XX';
  } catch {
    _cachedCountry = 'XX';
  }
  return _cachedCountry;
};

// ── Country flag emoji ────────────────────────────────────────────
export const getFlag = (code) => {
  if (!code || code === 'XX') return '🌍';
  try {
    return String.fromCodePoint(
      ...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))
    );
  } catch {
    return '🌍';
  }
};

// ── Time ago helper ───────────────────────────────────────────────
export const timeAgo = (ts) => {
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
};

// ── Vote state (localStorage + DB) ───────────────────────────────
export const getLocalVote = (questionId) => {
  const v = localStorage.getItem('voted_' + questionId);
  return v !== null ? parseInt(v, 10) : null;
};
export const setLocalVote = (questionId, optionIndex) => {
  localStorage.setItem('voted_' + questionId, String(optionIndex));
};

// ── Prediction state ──────────────────────────────────────────────
export const getLocalPrediction = (questionId) => {
  const v = localStorage.getItem('pred_' + questionId);
  return v !== null ? parseInt(v, 10) : null;
};
export const setLocalPrediction = (questionId, optionIndex) => {
  localStorage.setItem('pred_' + questionId, String(optionIndex));
};

// ── htm shorthand (use html`...` in components) ───────────────────
// html is set as a global in index.html after htm CDN loads.
// This re-exports it so components can import from db.js as before.
export const getHtml = () => window.html;
