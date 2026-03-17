// js/bottomnav.js
// ─────────────────────────────────────────────────────────────────
// Mobile-first bottom tab bar. Replaces scrolling to find nav links.
// Visible on mobile, hidden on desktop (desktop uses NavBar only).
// ─────────────────────────────────────────────────────────────────
import { db } from './db.js';
const { useLocation } = ReactRouterDOM;

const TAB_ITEMS = [
  { path: '/',        icon: '🌍', label: 'Home'    },
  { path: '/feed',    icon: '📋', label: 'Feed'    },
  { path: '/post',    icon: '+',  label: 'Ask',  primary: true },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export const BottomNav = ({ user }) => {
  const location = useLocation();
  const currentPath = '#' + (location.pathname || '/');

  return html`
    <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
      style="background:rgba(2,8,23,0.95);border-top:1px solid #1a2540;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)">
      <div class="flex items-stretch max-w-lg mx-auto">
        ${TAB_ITEMS.map(item => {
          const href = '#' + item.path;
          const isProfile = item.path === '/profile';
          const dest = isProfile && !user ? '#/auth' : href;
          const isActive = location.pathname === item.path ||
            (item.path === '/' && location.pathname === '/');

          if (item.primary) {
            return html`
              <a key=${item.path} href=${dest}
                class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
                <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-glow"
                  style="background:linear-gradient(135deg,#6366f1,#4f46e5)">
                  ${item.icon}
                </div>
                <span class="text-[10px] font-bold text-indigo-400">${item.label}</span>
              </a>
            `;
          }

          return html`
            <a key=${item.path} href=${dest}
              class=${'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ' + (isActive ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400')}>
              <span class="text-xl leading-none">${item.icon}</span>
              <span class=${'text-[10px] font-bold ' + (isActive ? 'text-indigo-400' : 'text-slate-600')}>${item.label}</span>
              ${isActive && html`<div class="w-1 h-1 rounded-full bg-indigo-500 mt-0.5"></div>`}
            </a>
          `;
        })}
      </div>
    </nav>
  `;
};
