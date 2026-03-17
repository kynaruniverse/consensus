/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1E3D',
          light:   '#102548',
          mid:     '#162E54',
          surface: '#1A3460',
          border:  '#1E3A6E',
          muted:   '#243F75',
        },
        forest: {
          DEFAULT: '#0D2C1C',
          light:   '#113623',
          surface: '#164530',
        },
        orange: {
          burnt:   '#7B3F00',
          mid:     '#8F4A00',
          light:   '#A35500',
          glow:    '#C46A00',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light:   '#E8C84A',
          shine:   '#F5DE7A',
          muted:   '#B8961E',
          dim:     '#7A6412',
        },
        silver: {
          DEFAULT: '#C0C0C0',
          light:   '#D8D8D8',
          dim:     '#8A8A8A',
          muted:   '#5A5A5A',
        },
        bronze: {
          DEFAULT: '#CD7F32',
          light:   '#E09040',
          muted:   '#9A5E20',
        },
        chart: {
          bg:   '#2C2C2C',
          bar1: '#D4AF37',
          bar2: '#C0C0C0',
          bar3: '#CD7F32',
          bar4: '#7B3F00',
          line: '#4A9EE8',
          area: '#1A3460',
        },
        text: {
          primary:   '#F5F5F5',
          secondary: '#C8D4E8',
          tertiary:  '#8A9BB8',
          muted:     '#536280',
          inverse:   '#0B1E3D',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['Roboto Mono', 'Menlo', 'monospace'],
      },
      spacing: {
        'sidebar': '260px',
        'topbar':  '60px',
      },
      borderRadius: {
        'pill':  '999px',
        'card':  '16px',
        'panel': '20px',
      },
      boxShadow: {
        'card':       '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
        'gold':       '0 0 20px rgba(212,175,55,0.35)',
        'gold-sm':    '0 0 8px rgba(212,175,55,0.25)',
        'panel':      '0 8px 40px rgba(0,0,0,0.5)',
        'btn':        '0 4px 12px rgba(0,0,0,0.4)',
        'btn-gold':   '0 4px 16px rgba(212,175,55,0.4)',
        'inner':      'inset 0 1px 3px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'app':           'radial-gradient(ellipse at 20% 0%, #102548 0%, #0B1E3D 50%, #080F1E 100%)',
        'sidebar-grad':  'linear-gradient(180deg, #0D2C1C 0%, #0B1E3D 60%, #080F1E 100%)',
        'btn-gold':      'linear-gradient(145deg, #E8C84A 0%, #D4AF37 50%, #B8961E 100%)',
        'btn-silver':    'linear-gradient(145deg, #D8D8D8 0%, #C0C0C0 50%, #8A8A8A 100%)',
        'btn-bronze':    'linear-gradient(145deg, #E09040 0%, #CD7F32 50%, #9A5E20 100%)',
        'btn-orange':    'linear-gradient(145deg, #A35500 0%, #7B3F00 50%, #5A2D00 100%)',
        'card-surface':  'linear-gradient(145deg, #162E54 0%, #0F2244 100%)',
        'panel-surface': 'linear-gradient(145deg, #1A3460 0%, #102548 100%)',
        'gold-shimmer':  'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.15) 50%, transparent 100%)',
        'chart-fill':    'linear-gradient(180deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.0) 100%)',
      },
      animation: {
        'shimmer':    'shimmer 2.5s ease infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'fade-in':    'fadeIn 0.5s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'slide-in-r': 'slideInRight 0.35s ease forwards',
        'bounce-in':  'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'skeleton':   'skeleton 1.8s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(212,175,55,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(212,175,55,0.6)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.8)' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        skeleton: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
