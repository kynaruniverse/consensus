/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#0C0B0A',
        'bg-metal': '#1A1816',
        'bg-surface': '#252320',
        'bronze': '#B67A4F',
        'bronze-light': '#D49C6C',
        'bronze-dark': '#8B5E3C',
        'gold': '#C4A24C',
        'gold-light': '#E5C87C',
        'gold-dark': '#9E7E3A',
        'silver': '#9CA3AF',
        'silver-light': '#D1D5DB',
        'silver-dark': '#6B7280',
        'copper': '#B87333',
        'rust': '#A85E2F',
        'pewter': '#7A7D84',
        'text-primary': '#FFFFFF',
        'text-secondary': '#E5E5E5',
        'text-tertiary': '#9CA3AF',
        'border-metal': '#2D2823',
        'border-metal-light': '#3A3530',
      },
    },
  },
  plugins: [],
}
