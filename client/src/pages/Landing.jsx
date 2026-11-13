import { useState } from 'react';
import { Link } from 'react-router-dom';
import Stickies from '../components/Stickies';
import { useAuth } from '../context/AuthContext';

const DEMO = [
  {
    re: /auth|login|jwt|password/i, note: 's1', src: 'Auth',
    a: (<>The team chose <mark>JWT with bcrypt-hashed passwords</mark>. Tokens expire after <mark>7 days</mark>.</>),
  },
  {
    re: /schema|database|collection|mongo/i, note: 's2', src: 'Schema',
    a: (<>There are three collections: <mark>Users</mark>, <mark>Workspaces</mark> and <mark>Documents</mark>.</>),
  },
  {
    re: /week|summar|progress|status/i, note: 's3', src: 'This week',
    a: (<>This week: <mark>auth is done</mark>, the editor has started, and live sync is next.</>),
  },
];

const SUGGESTIONS = ['What did we decide on auth?', 'What is our database schema?', 'Summarize this week'];

export default function Landing() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [ans, setAns] = useState(null);
  const [glow, setGlow] = useState(null);

  const run = (text) => {
    const question = (text ?? q).trim() || SUGGESTIONS[0];
    setQ(question);
    setAns('loading');
    setGlow(null);
    setTimeout(() => {
      const hit = DEMO.find((d) => d.re.test(question));
      setAns(hit || 'none');
      if (hit) {
        setTimeout(() => setGlow(hit.note), 30);
        setTimeout(() => setGlow(null), 1700);
      }
    }, 700);
  };

  return (
    <div>
      {/* top bar */}
      <header className="flex justify-between items-center px-6 md:px-10 py-5">
        <div className="font-display text-2xl font-extrabold">
          collab<span className="hl">docs</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#how" className="hidden sm:block font-semibold text-sm">How it works</a>
          <Link to={user ? '/dashboard' : '/auth'} className="btn">
            {user ? 'Open app' : 'Sign in'}
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="grid md:grid-cols-2 gap-8 px-6 md:px-10 pt-4 pb-10 items-center">
        <div>
          <p className="eye">Notes for teams that ask questions</p>
          <h1 className="text-5xl md:text-6xl my-3">
            Your notes, now with <span className="hl">answers</span>.
          </h1>
          <p className="opacity-70 mb-5 max-w-md">
            Write together. Then just ask: CollabDocs finds the answer in your own notes and shows you where.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
            className="flex gap-3 max-w-lg mb-3"
          >
            <input
              className="input"
              placeholder="Try: What did we decide on auth?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-ac">Ask</button>
          </form>
          <div>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => run(s)}>{s}</button>
            ))}
          </div>

          {ans && (
            <div className="box mt-4 max-w-lg fade-up">
              {ans === 'loading' ? (
                <span className="dots"><i /><i /><i /></span>
              ) : ans === 'none' ? (
                <p>I couldn’t find that in these sample notes. Sign up to ask your own.</p>
              ) : (
                <>
                  <p className="mb-2">{ans.a}</p>
                  <p className="text-xs opacity-70">Found in: {ans.src}</p>
                </>
              )}
            </div>
          )}
        </div>

        <Stickies glow={glow} />
      </section>

      {/* how it works */}
      <section id="how" className="grid md:grid-cols-3 gap-5 px-6 md:px-10 pb-12">
        {[
          ['01', 'Write', 'A live editor where every teammate has a cursor.'],
          ['02', 'Share', 'One notebook per project. Invite by email.'],
          ['03', 'Ask', 'Answers cite the exact notes they came from.'],
        ].map(([n, t, d]) => (
          <div key={n} className="box transition hover:-translate-y-1">
            <span className="bg-ink text-paper text-xs font-bold rounded-md px-2 py-0.5">{n}</span>
            <h3 className="text-xl mt-2">{t}</h3>
            <p className="opacity-70 text-sm">{d}</p>
          </div>
        ))}
      </section>

      {/* call to action */}
      <section className="cta">
        <div>
          <p className="eye">Free for students</p>
          <h2>Ready to <span className="hl text-ink">ask your notes?</span></h2>
        </div>
        <Link to="/auth" className="btn">Start a notebook →</Link>
      </section>

      {/* footer */}
      <footer className="ft">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-2xl font-extrabold">
              collab<span className="hl text-ink">docs</span>
            </div>
            <p>Shared notes with answers that cite their sources.</p>
          </div>
          <div>
            <h4>Product</h4>
            <Link to="/auth">Sign up</Link>
            <Link to="/auth">Log in</Link>
          </div>
          <div>
            <h4>Built with</h4>
            <span className="li">React</span>
            <span className="li">Node.js + Express</span>
            <span className="li">MongoDB</span>
            <span className="li">Socket.io</span>
          </div>
          <div>
            <h4>Connect</h4>
            <a href="https://github.com/manmehak1802" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a href="mailto:manmehakkaur7@gmail.com">Email</a>
          </div>
        </div>

        <div className="big">
          {'collabdocs'.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>

        <div className="flex justify-between items-center gap-3 flex-wrap text-sm">
          <span>© 2026 CollabDocs · Made in Bathinda</span>
          <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}