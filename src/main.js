// ============================================================
// CONSENSUS — main.js
// CDN globals available: React, ReactDOM, ReactRouterDOM,
// Recharts, html2canvas, supabase (the lib, lowercase)
// ============================================================

// Fix #1: Correct Supabase init (old code had naming collision crash)
const { createClient } = supabase;
const db = createClient(
  'https://nxwublmqbysqboadwqav.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54d3VibG1xYnlzcWJvYWR3cWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDY1MzEsImV4cCI6MjA4OTA4MjUzMX0.mD24igp7ccd_y70Up3Pq-8pEBI7Y7lXjg160bvBLM8E'
);

// Globals from CDN
const { useState, useEffect } = React;

// Fix #2: HashRouter instead of BrowserRouter (required for GitHub Pages)
const { HashRouter, Routes, Route, Link, useParams, useNavigate } = ReactRouterDOM;
const { PieChart, Pie, Cell, Tooltip, Legend } = Recharts;

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8'];

const getFlag = (code) => {
  if (!code || code === 'XX') return '🌍';
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
  } catch { return '🌍'; }
};

// ── NavBar ────────────────────────────────────────────────────
const NavBar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
    <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
      <Link to="/" className="text-xl font-black tracking-tight">
        <span style={{color:'#818cf8'}}>con</span>sensus
      </Link>
      <Link
        to="/post"
        className="text-sm font-bold px-5 py-2 rounded-full text-white transition"
        style={{background:'#4f46e5'}}
      >
        + Ask the world
      </Link>
    </div>
  </nav>
);

// ── Home ──────────────────────────────────────────────────────
const Home = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setQuestions(data || []); setLoading(false); });
  }, []);

  return (
    <div className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
      <div className="text-center py-10 mb-4">
        <h1 className="text-5xl font-black mb-3 leading-tight">
          <span style={{background:'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
            What does the<br/>world think?
          </span>
        </h1>
        <p className="text-gray-400 text-lg">Vote. See the planet respond. Share the result.</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8 text-sm text-gray-500">
        <span style={{width:8,height:8,borderRadius:'50%',background:'#34d399',display:'inline-block',animation:'pulse-dot 1.5s infinite'}}></span>
        Results update in real time
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-20 text-lg">Loading...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-gray-400 text-lg mb-2">No questions yet.</p>
          <p className="text-gray-600">Be the first to ask the world something.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => <QuestionCard key={q.id} question={q} />)}
        </div>
      )}
    </div>
  );
};

// ── QuestionCard ──────────────────────────────────────────────
const QuestionCard = ({ question }) => {
  const voted = localStorage.getItem(`voted_${question.id}`) !== null;
  return (
    <Link
      to={`/q/${question.id}`}
      className="block rounded-2xl border p-5 transition-all"
      style={{background:'#111827', borderColor:'#1f2937'}}
    >
      <p className="text-lg font-semibold mb-3 leading-snug">{question.question_text}</p>
      <div className="flex items-end justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {question.options.slice(0, 3).map((opt, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-full border"
              style={{borderColor: COLORS[i%COLORS.length]+'44', color: COLORS[i%COLORS.length], background: COLORS[i%COLORS.length]+'11'}}>
              {opt}
            </span>
          ))}
          {question.options.length > 3 && (
            <span className="text-xs text-gray-600 py-1">+{question.options.length - 3} more</span>
          )}
        </div>
        <span className="text-sm shrink-0" style={{color: voted ? '#34d399' : '#6366f1'}}>
          {voted ? '✓ Voted' : 'Vote →'}
        </span>
      </div>
    </Link>
  );
};

// ── PostPage ──────────────────────────────────────────────────
const PostPage = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);

  const addOption = () => { if (options.length < 4) setOptions([...options, '']); };
  const removeOption = (i) => { if (options.length > 2) setOptions(options.filter((_,idx) => idx !== i)); };

  const post = async () => {
    const valid = options.filter(o => o.trim() !== '');
    if (!question.trim() || valid.length < 2) { alert('Add a question and at least 2 options.'); return; }
    setPosting(true);
    const { data, error } = await db.from('questions').insert({ question_text: question.trim(), options: valid }).select().single();
    setPosting(false);
    if (error) { alert('Error: ' + error.message); return; }
    navigate(`/q/${data.id}`);
  };

  return (
    <div className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
      <h2 className="text-3xl font-black mb-2">Ask the world</h2>
      <p className="text-gray-500 mb-6">Post a question and watch the votes roll in live.</p>
      <div className="rounded-2xl border border-gray-800 p-6 space-y-4" style={{background:'#111827'}}>
        <textarea
          placeholder="What do you want the world to decide? e.g. Is a hotdog a sandwich?"
          className="w-full p-4 rounded-xl text-lg resize-none outline-none h-28 border transition-all w-full"
          style={{background:'#1f2937', borderColor:'#374151', color:'white'}}
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{background: COLORS[i%COLORS.length]+'22', color: COLORS[i%COLORS.length]}}>
                {i+1}
              </div>
              <input
                type="text"
                placeholder={`Option ${i+1}${i < 2 ? ' (required)' : ''}`}
                className="flex-1 p-3 rounded-xl border outline-none transition-all"
                style={{background:'#1f2937', borderColor:'#374151', color:'white'}}
                value={opt}
                onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-400 transition text-xl">×</button>
              )}
            </div>
          ))}
        </div>
        {options.length < 4 && (
          <button onClick={addOption} style={{color:'#818cf8'}} className="text-sm">+ Add another option</button>
        )}
        <button
          onClick={post}
          disabled={posting}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 text-white"
          style={{background: posting ? '#374151' : '#4f46e5'}}
        >
          {posting ? 'Posting...' : '🌍 Post to the World'}
        </button>
      </div>
    </div>
  );
};

// ── QuestionPage ──────────────────────────────────────────────
const QuestionPage = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [country, setCountry] = useState('XX');
  const [voting, setVoting] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(`voted_${id}`);
    if (stored !== null) setMyVote(parseInt(stored, 10));
  }, [id]);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => setCountry(d.country_code || 'XX'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    db.from('questions').select('*').eq('id', id).single().then(({ data }) => setQuestion(data));

    const loadVotes = async () => {
      const { data } = await db.from('votes').select('*').eq('question_id', id);
      setVotes(data || []);
    };
    loadVotes();

    const channel = db.channel(`votes:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `question_id=eq.${id}` }, loadVotes)
      .subscribe();

    return () => db.removeChannel(channel);
  }, [id]);

  const castVote = async (index) => {
    if (myVote !== null || voting) return;
    setVoting(true);
    const { error } = await db.from('votes').insert({ question_id: id, option_index: index, country_code: country });
    setVoting(false);
    if (error) { alert('Vote failed: ' + error.message); return; }
    setMyVote(index);
    localStorage.setItem(`voted_${id}`, String(index));
  };

  const shareCard = async () => {
    const el = document.getElementById('results-card');
    if (!el) return;
    setShareMsg('Generating image...');
    try {
      const canvas = await html2canvas(el, { backgroundColor: '#0f172a', scale: 2 });
      const a = document.createElement('a');
      a.download = `consensus-${id.slice(0,8)}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      setShareMsg('');
    } catch(e) { setShareMsg(''); alert('Image failed: ' + e.message); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => { setShareMsg('✓ Link copied!'); setTimeout(() => setShareMsg(''), 2000); })
      .catch(() => setShareMsg('Copy failed — copy the URL manually.'));
  };

  if (!question) return <div className="pt-20 text-center text-gray-600 py-20 text-xl">Loading...</div>;

  const total = votes.length;
  const chartData = question.options.map((opt, i) => ({
    name: opt,
    value: votes.filter(v => v.option_index === i).length
  }));

  const countryStats = votes.reduce((acc, v) => {
    const c = v.country_code || 'XX'; acc[c] = (acc[c] || 0) + 1; return acc;
  }, {});
  const topCountries = Object.entries(countryStats).sort((a,b) => b[1]-a[1]).slice(0,8);

  return (
    <div className="pt-16 pb-16 px-4 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm mt-4 mb-6 transition" style={{color:'#818cf8'}}>
        ← All Questions
      </Link>

      <h1 className="text-3xl font-black mb-6 leading-tight">{question.question_text}</h1>

      {/* Vote buttons */}
      <div className="space-y-3 mb-10">
        {question.options.map((opt, i) => {
          const count = votes.filter(v => v.option_index === i).length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isMyVote = myVote === i;
          const hasVoted = myVote !== null;
          return (
            <button
              key={i}
              onClick={() => castVote(i)}
              disabled={hasVoted || voting}
              className="w-full relative overflow-hidden text-left p-4 rounded-2xl border font-semibold transition-all disabled:cursor-not-allowed"
              style={{
                background: isMyVote ? '#1e1b4b' : '#111827',
                borderColor: isMyVote ? '#6366f1' : '#1f2937'
              }}
            >
              {hasVoted && (
                <div className="absolute left-0 top-0 h-full rounded-2xl opacity-20"
                  style={{width:`${pct}%`, background: COLORS[i%COLORS.length], transition:'width 0.8s ease'}} />
              )}
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {isMyVote && <span style={{color:'#818cf8'}}>✓</span>}
                  {opt}
                </span>
                {hasVoted && (
                  <span className="font-black text-base" style={{color: COLORS[i%COLORS.length]}}>{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Results Card — screenshot target */}
      <div id="results-card" className="rounded-3xl border p-6 shadow-2xl" style={{background:'#0f172a', borderColor:'#1e293b'}}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-black text-xl">Live Results</h2>
            <p className="text-gray-500 text-sm mt-0.5">{question.question_text}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span style={{width:8,height:8,borderRadius:'50%',background:'#34d399',display:'inline-block'}}></span>
              <span className="text-xs text-gray-500">LIVE</span>
            </div>
            <div className="text-2xl font-black mt-0.5">{total}</div>
            <div className="text-xs text-gray-600">votes</div>
          </div>
        </div>

        {total === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <div className="text-4xl mb-3">🗳️</div>
            <p>No votes yet — be the first!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <PieChart width={280} height={260}>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={3}
                  label={({percent}) => percent > 0.04 ? `${Math.round(percent*100)}%` : ''} labelLine={false}>
                  {chartData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v,n) => [`${v} votes`, n]} />
                <Legend />
              </PieChart>
            </div>

            {topCountries.length > 0 && (
              <div className="border-t pt-5" style={{borderColor:'#1e293b'}}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">By Country</h3>
                <div className="space-y-3">
                  {topCountries.map(([code, count]) => {
                    const pct = Math.round((count/total)*100);
                    return (
                      <div key={code} className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center">{getFlag(code)}</span>
                        <div className="flex-1 rounded-full overflow-hidden h-2" style={{background:'#1e293b'}}>
                          <div className="h-full rounded-full" style={{width:`${pct}%`, background:'#6366f1', transition:'width 0.8s ease'}} />
                        </div>
                        <span className="text-sm text-gray-400 shrink-0 w-16 text-right">{code} · {pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-6 pt-4 flex items-center justify-between border-t" style={{borderColor:'#1e293b'}}>
          <span className="text-xs font-black" style={{color:'#818cf8'}}>consensus</span>
          <span className="text-xs text-gray-700">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Share actions */}
      <div className="mt-4 space-y-3">
        <button
          onClick={shareCard}
          className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 text-white"
          style={{background:'#059669'}}
        >
          📸 Save &amp; Share Result Card
        </button>
        <button
          onClick={copyLink}
          className="w-full py-3 rounded-2xl text-sm font-semibold border transition-all"
          style={{background:'transparent', borderColor:'#1f2937', color:'#9ca3af'}}
        >
          🔗 Copy Link to Share
        </button>
        {shareMsg && <p className="text-center text-sm" style={{color:'#34d399'}}>{shareMsg}</p>}
      </div>
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────
// Fix #3: HashRouter — BrowserRouter breaks on GitHub Pages
const App = () => (
  <HashRouter>
    <div className="min-h-screen" style={{background:'#030712', color:'white'}}>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post" element={<PostPage />} />
        <Route path="/q/:id" element={<QuestionPage />} />
      </Routes>
    </div>
  </HashRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
