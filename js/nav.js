// js/nav.js
// ─────────────────────────────────────────────────────────────────
// Top navigation bar — desktop primary, mobile supplementary.
// Uses htm for JSX-like syntax.
// ─────────────────────────────────────────────────────────────────
import { db }              from './db.js';
import { NotificationBell } from './notifications.js';
const { useLocation }      = ReactRouterDOM;

export const NavBar = ({ user }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return html`
    <nav class="fixed top-0 left-0 right-0 z-[100]"
      style="background:rgba(2,8,23,0.88);border-bottom:1px solid rgba(26,37,64,0.8);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)">
      <div class="max-w-[640px] mx-auto px-5 h-[58px] flex items-center justify-between">

        <!-- Logo -->
        <a href="#/" class="text-xl font-black tracking-tight no-underline select-none">
          <span style="color:#818cf8">Spit</span><span class="text-slate-100">fact</span>
        </a>

        <!-- Right side — hidden on mobile (bottom nav takes over) -->
        <div class="flex items-center gap-2">

          <!-- Feed link (desktop only) -->
          <a href="#/feed"
            class=${'hidden md:block text-[13px] font-semibold px-3 py-1.5 rounded-full no-underline transition-colors ' + (isActive('/feed') ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300')}>
            Feed
          </a>

          <!-- Ask button -->
          <a href="#/post"
            class="text-[13px] font-bold text-white px-4 py-2 rounded-full no-underline transition-all shadow-glow"
            style="background:linear-gradient(135deg,#6366f1,#4f46e5)">
            + Ask
          </a>

          <!-- Signed-in: bell + avatar -->
          ${user
            ? html`
              <div class="flex items-center gap-2">
                <${NotificationBell} user=${user} />
                <a href="#/profile"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black text-white no-underline flex-shrink-0"
                  style="background:linear-gradient(135deg,#6366f1,#a78bfa)"
                  title=${user.username || user.email}>
                  ${(user.username || user.email || '?')[0].toUpperCase()}
                </a>
              </div>
            `
            : html`
              <a href="#/auth"
                class="text-[13px] font-semibold text-slate-500 hover:text-slate-300 px-2 py-1.5 no-underline transition-colors">
                Sign in
              </a>
            `
          }
        </div>
      </div>
    </nav>
  `;
};
