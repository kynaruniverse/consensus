// js/db.js
// Supabase client + shared constants + helper functions
// React/supabase are loaded as CDN globals in index.html

export const db = supabase.createClient(
  'https://nxwublmqbysqboadwqav.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54d3VibG1xYnlzcWJvYWR3cWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDY1MzEsImV4cCI6MjA4OTA4MjUzMX0.mD24igp7ccd_y70Up3Pq-8pEBI7Y7lXjg160bvBLM8E'
);

export const COLORS = ['#818cf8','#34d399','#fbbf24','#f87171','#a78bfa','#38bdf8'];

export const AGE_RANGES = ['Under 18','18–24','25–34','35–44','45–54','55+'];
export const GENDERS    = ['Male','Female','Non-binary','Prefer not to say'];

// Turn a 2-letter country code into a flag emoji
export const getFlag = code => {
  if (!code || code === 'XX') return '🌍';
  try { return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))); }
  catch { return '🌍'; }
};

// Shorthand React.createElement helpers
// React is a CDN global — accessible directly in ES modules
export const e    = React.createElement;
export const div  = (props,...children) => e('div', props, ...children);
export const span = (props,...children) => e('span', props, ...children);
export const p    = (props,...children) => e('p', props, ...children);
