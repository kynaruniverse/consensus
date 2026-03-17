/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#020817',
        surface: '#0d1424',
        border1: '#1a2540',
        border2: '#243050',
        subtle: '#1e293b',
        indigo: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#818cf8',
        },
        cyan: '#22d3ee',
        pink: '#e879f9',
      },
    },
  },
  plugins: [],
}
