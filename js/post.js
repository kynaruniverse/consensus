// js/post.js
// ─────────────────────────────────────────────────────────────────
// Post a new question. Fixes: alert() → toast, added category,
// max 4 options enforced, useNavigate instead of hash manipulation.
// ─────────────────────────────────────────────────────────────────
import { db, COLORS, CATEGORIES } from './db.js';
import { useToast }                from './app.js';
const { useState }                 = React;
const { useNavigate }              = ReactRouterDOM;

export const PostPage = ({ user }) => {
  const [question, setQuestion] = useState('');
  const [options,  setOptions]  = useState(['', '']);
  const [category, setCategory] = useState('General');
  const [posting,  setPosting]  = useState(false);
  const toast    = useToast();
  const navigate = useNavigate();

  const post = async () => {
    const valid = options.filter(o => o.trim() !== '');
    if (!question.trim()) {
      toast.error('Please enter a question.'); return;
    }
    if (valid.length < 2) {
      toast.error('Add at least 2 options.'); return;
    }
    setPosting(true);

    const payload = {
      question_text: question.trim(),
      options:       valid,
      category,
    };
    if (user) payload.created_by = user.id;

    const { data, error } = await db.from('questions').insert(payload).select().single();
    setPosting(false);

    if (error) {
      toast.error('Could not post: ' + error.message); return;
    }
    navigate('/q/' + data.id);
  };

  const cat = CATEGORIES.find(c => c.id === category);

  return html`
    <div class="max-w-[640px] mx-auto px-4 pt-[90px] pb-[100px] animate-fade-up">

      <!-- Header -->
      <div class="mb-7">
        <h1 class="text-[28px] font-black tracking-tight text-slate-100 mb-1.5">Ask the world</h1>
        <p class="text-slate-500 text-[15px] leading-relaxed">
          Post your question and watch votes come in live from around the globe.
        </p>
      </div>

      <div class="g-border rounded-[20px] p-6">

        <!-- Question textarea -->
        <div class="mb-5">
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-2">
            Your question
          </label>
          <textarea
            class="w-full bg-subtle border border-border2 text-slate-100 rounded-[12px] px-3.5 py-3 text-[15px] leading-relaxed outline-none resize-none transition-all focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 placeholder:text-slate-600"
            placeholder="e.g. Is a hotdog a sandwich? · Who is the GOAT? · Pineapple on pizza?"
            rows="3"
            value=${question}
            onInput=${ev => setQuestion(ev.target.value)}
          ></textarea>
          <div class=${'text-right text-xs mt-1 font-medium ' + (question.length > 200 ? 'text-red-400' : 'text-slate-600')}>
            ${question.length}/200
          </div>
        </div>

        <!-- Category -->
        <div class="mb-5">
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-2">
            Category
          </label>
          <div class="flex flex-wrap gap-2">
            ${CATEGORIES.map(c => html`
              <button key=${c.id}
                onClick=${() => setCategory(c.id)}
                class=${'text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ' + (category === c.id ? 'border-transparent text-white' : 'border-border1 text-slate-600 bg-transparent hover:border-border2')}
                style=${category === c.id ? 'background:' + c.color + '22;border-color:' + c.color + '55;color:' + c.color : ''}
              >
                ${c.label}
              </button>
            `)}
          </div>
        </div>

        <!-- Options -->
        <div class="mb-5">
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-2">
            Options (2–4)
          </label>
          <div class="flex flex-col gap-2">
            ${options.map((opt, i) => html`
              <div key=${i} class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black"
                  style=${'background:' + COLORS[i % COLORS.length] + '20;color:' + COLORS[i % COLORS.length]}>
                  ${i + 1}
                </div>
                <input
                  type="text"
                  class="flex-1 bg-subtle border border-border2 text-slate-100 rounded-[12px] px-3.5 py-3 text-[14px] outline-none transition-all focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 placeholder:text-slate-600"
                  placeholder=${'Option ' + (i + 1) + (i < 2 ? ' (required)' : ' (optional)')}
                  value=${opt}
                  onInput=${ev => {
                    const n = [...options];
                    n[i] = ev.target.value;
                    setOptions(n);
                  }}
                />
                ${options.length > 2 && html`
                  <button
                    onClick=${() => setOptions(options.filter((_, j) => j !== i))}
                    aria-label="Remove option"
                    class="text-slate-600 hover:text-red-400 text-2xl leading-none bg-transparent border-none cursor-pointer transition-colors px-1 flex-shrink-0">
                    ×
                  </button>
                `}
              </div>
            `)}
          </div>
        </div>

        <!-- Add option -->
        ${options.length < 4 && html`
          <button
            onClick=${() => setOptions([...options, ''])}
            class="text-indigo-400 hover:text-indigo-300 text-[13px] font-semibold bg-transparent border-none cursor-pointer pb-5 block transition-colors">
            + Add another option
          </button>
        `}

        <!-- Submit -->
        <button
          class="w-full py-4 rounded-[14px] text-white font-bold text-[16px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style="background:linear-gradient(135deg,#6366f1,#4f46e5);box-shadow:0 4px 20px rgba(99,102,241,0.35)"
          onClick=${post}
          disabled=${posting || question.length > 200}
        >
          ${posting ? '⏳ Posting...' : '🌍 Post to the World'}
        </button>

        ${!user && html`
          <p class="text-center mt-3.5 text-[13px] text-slate-500">
            Posting anonymously.${' '}
            <a href="#/auth" class="text-indigo-400 font-semibold hover:text-indigo-300">Sign in</a>
            ${' '}to track your questions.
          </p>
        `}
      </div>
    </div>
  `;
};
