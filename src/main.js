// Destructure globals from CDNs
const { createRoot } = ReactDOM;
const { BrowserRouter, Routes, Route, Link, useParams } = ReactRouterDOM;
const { useState, useEffect } = React;
const { PieChart, Pie, Cell, Tooltip, Legend } = Recharts;

// Supabase config — REPLACE THESE with your real values from Phase 1
const SUPABASE_URL = 'https://nxwublmqbysqboadwqav.supabase.co'; // ← paste your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54d3VibG1xYnlzcWJvYWR3cWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDY1MzEsImV4cCI6MjA4OTA4MjUzMX0.mD24igp7ccd_y70Up3Pq-8pEBI7Y7lXjg160bvBLM8E'; // ← paste your anon key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple Home component (list questions + post new)
const Home = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  
  useEffect(() => {
    supabase.from('questions').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setQuestions(data || []));
  }, []);
  
  const addOption = () => setOptions([...options, '']);
  
  const postQuestion = async () => {
    const validOptions = options.filter(o => o.trim() !== '');
    if (newQuestion.trim() === '' || validOptions.length < 2) return alert('Need question + 2+ options');
    
    const { data, error } = await supabase.from('questions').insert({
      question_text: newQuestion,
      options: validOptions
    }).select();
    
    if (error) return alert('Error: ' + error.message);
    setNewQuestion('');
    setOptions(['', '']);
    // Refresh list
    supabase.from('questions').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setQuestions(data || []));
  };
  
  return React.createElement('div', { className: 'p-4 max-w-2xl mx-auto' },
    React.createElement('h1', { className: 'text-4xl font-bold text-center mb-8' }, 'Consensus'),
    
    // Post form
    React.createElement('div', { className: 'bg-gray-800 p-6 rounded-2xl mb-8' },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Ask the world anything...',
        className: 'w-full bg-gray-700 p-4 rounded-xl text-lg mb-4',
        value: newQuestion,
        onChange: e => setNewQuestion(e.target.value)
      }),
      options.map((opt, i) =>
        React.createElement('input', {
          key: i,
          type: 'text',
          placeholder: `Option ${i + 1}`,
          className: 'w-full bg-gray-700 p-3 rounded-xl mb-2',
          value: opt,
          onChange: e => {
            const newOpts = [...options];
            newOpts[i] = e.target.value;
            setOptions(newOpts);
          }
        })
      ),
      React.createElement('button', {
        onClick: addOption,
        className: 'text-blue-400 mb-4 block'
      }, '+ Add option'),
      React.createElement('button', {
        onClick: postQuestion,
        className: 'bg-blue-600 w-full py-4 rounded-xl font-bold'
      }, 'Post Question')
    ),
    
    // Question list
    React.createElement('h2', { className: 'text-2xl mb-4' }, 'Recent Questions'),
    questions.map(q =>
      React.createElement(Link, {
        key: q.id,
        to: `/q/${q.id}`,
        className: 'block bg-gray-800 p-4 rounded-2xl mb-3 hover:bg-gray-700'
      }, q.question_text)
    )
  );
};

// Question detail + vote + live results
const QuestionPage = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [country, setCountry] = useState('');
  
  useEffect(() => {
    // Get country (free IP API)
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => setCountry(d.country_code || 'XX'));
  }, []);
  
  useEffect(() => {
    if (!id) return;
    supabase.from('questions').select('*').eq('id', id).single()
      .then(({ data }) => setQuestion(data));
    
    // Realtime votes
    const channel = supabase.channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `question_id=eq.${id}` }, () => loadVotes())
      .subscribe();
    
    loadVotes();
    
    return () => supabase.removeChannel(channel);
  }, [id]);
  
  const loadVotes = async () => {
    const { data } = await supabase.from('votes').select('*').eq('question_id', id);
    setVotes(data || []);
  };
  
  const vote = async (index) => {
    if (myVote !== null) return;
    const { error } = await supabase.from('votes').insert({
      question_id: id,
      option_index: index,
      voter_ip: 'anon-' + Date.now(), // simple unique for MVP
      country_code: country
    });
    if (!error) {
      setMyVote(index);
      loadVotes();
    } else {
      alert('Vote failed: ' + error.message);
    }
  };
  
  if (!question) return React.createElement('div', { className: 'p-8 text-center' }, 'Loading...');
  
  const chartData = question.options.map((opt, i) => ({
    name: opt,
    value: votes.filter(v => v.option_index === i).length
  }));
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  return React.createElement('div', { className: 'p-4 max-w-2xl mx-auto' },
    React.createElement('h1', { className: 'text-3xl font-bold mb-8' }, question.question_text),
    
    // Vote buttons
    question.options.map((opt, i) =>
      React.createElement('button', {
        key: i,
        onClick: () => vote(i),
        disabled: myVote !== null,
        className: `w-full bg-gray-800 hover:bg-blue-600 p-6 text-xl rounded-2xl mb-3 disabled:opacity-50 ${myVote === i ? 'bg-blue-700' : ''}`
      }, opt)
    ),
    
    // Live results
    React.createElement('div', { className: 'bg-gray-800 p-6 rounded-3xl mt-10' },
      React.createElement('h2', { className: 'text-2xl mb-4' }, `Live Results • ${votes.length} votes`),
      React.createElement(PieChart, { width: 320, height: 320 },
        React.createElement(Pie, {
            data: chartData,
            dataKey: "value",
            nameKey: "name",
            cx: "50%",
            cy: "50%",
            outerRadius: 120
          },
          chartData.map((entry, index) =>
            React.createElement(Cell, { key: `cell-${index}`, fill: COLORS[index % COLORS.length] })
          )
        ),
        React.createElement(Tooltip, null),
        React.createElement(Legend, null)
      )
    )
  );
};

// Main app
const App = () => {
  return React.createElement(BrowserRouter, null,
    React.createElement('div', { className: 'min-h-screen bg-gray-950' },
      React.createElement(Routes, null,
        React.createElement(Route, { path: "/", element: React.createElement(Home) }),
        React.createElement(Route, { path: "/q/:id", element: React.createElement(QuestionPage) })
      )
    )
  );
};

// Render
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));