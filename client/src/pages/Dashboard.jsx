import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils/time';

// A notebook cover that tilts toward your mouse
function Cover({ w, i }) {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-4px)`;
  };
  const leave = () => {
    ref.current.style.transform = '';
  };
  const n = w.members.length;

  return (
    <Link ref={ref} to={`/workspace/${w._id}`} onMouseMove={move} onMouseLeave={leave} className={`nb nb-${i % 10}`}>
      <span className="t">{w.name}</span>
      <small className="opacity-80">{n} member{n === 1 ? '' : 's'}</small>
    </Link>
  );
}

// A small to-do list saved in your browser
function Todo({ userId }) {
  const key = `todos:${userId}`;
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  });
  const [text, setText] = useState('');

  const save = (next) => {
    setItems(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const add = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    save([{ id: Date.now(), text: t, done: false }, ...items]);
    setText('');
  };

  const left = items.filter((x) => !x.done).length;

  return (
    <div>
      <form onSubmit={add} className="flex gap-2 mb-3">
        <input className="input" placeholder="Add a task…" value={text} maxLength={100} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-ac">Add</button>
      </form>
      <div className="max-h-40 overflow-auto">
        {items.length === 0 && <p className="opacity-70 text-sm">Nothing to do. Add your first task.</p>}
        {items.map((x) => (
          <div key={x.id} className={`todo-row ${x.done ? 'done' : ''}`}>
            <input
              type="checkbox"
              checked={x.done}
              style={{ accentColor: 'var(--ac)', width: '1.1rem', height: '1.1rem' }}
              onChange={() => save(items.map((i) => (i.id === x.id ? { ...i, done: !i.done } : i)))}
            />
            <span>{x.text}</span>
            <button className="todo-x" aria-label="Delete task" onClick={() => save(items.filter((i) => i.id !== x.id))}>×</button>
          </div>
        ))}
      </div>
      {items.length > 0 && <p className="text-xs opacity-60 mt-2">{left} left</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [workspaces, setWorkspaces] = useState(null);
  const [recent, setRecent] = useState({ total: 0, recent: [] });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    api.get('/workspaces').then((r) => setWorkspaces(r.data)).catch(() => setWorkspaces([]));
    api.get('/documents/recent').then((r) => setRecent(r.data)).catch(() => {});
  }, []);

  const list = workspaces || [];
  const myId = String(user._id || user.id);
  const owned = list.filter((w) => String(w.owner) === myId).length;
  const people = new Set(list.flatMap((w) => w.members.map((m) => String(m.user))));
  people.delete(myId);
  const first = user.name.split(' ')[0];

  const stats = [
    [list.length, 'notebooks'],
    [recent.total, 'documents'],
    [people.size, 'teammates'],
    [owned, 'you own'],
  ];

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await api.post('/workspaces', { name });
      setWorkspaces([data, ...list]);
      setName('');
      setAdding(false);
      toast('Notebook created');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not create notebook');
    }
  };

  return (
    <div>
      <h1 className="text-4xl md:text-5xl mb-8">
        Hey {first}, <span className="hl">ready to write?</span>
      </h1>

      {/* stats in 2 x 2, to-do beside them */}
      <div className="grid lg:grid-cols-[minmax(18rem,28rem)_1fr] gap-6 items-stretch mb-10">
        <div className="stat-grid">
          {stats.map(([n, label]) => (
            <div key={label} className="stat">
              <b>{n}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="box">
          <h3 className="text-2xl mb-3">To-do</h3>
          <Todo userId={myId} />
        </div>
      </div>

      <h2 className="text-2xl mb-4">Your notebooks</h2>

      {workspaces === null ? (
        <p className="font-bold">Loading…</p>
      ) : (
        <>
          {list.length === 0 && (
            <div className="box mb-6 fade-up">
              <h3 className="text-2xl mb-1">Your first notebook starts here</h3>
              <p className="opacity-70">
                A notebook holds documents for one project. Create one below, then invite teammates.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-10">
            {list.map((w, i) => (
              <Cover key={w._id} w={w} i={i} />
            ))}

            {adding ? (
              <form onSubmit={create} className="nb nb-new nb-form">
                <input
                  autoFocus
                  className="input"
                  placeholder="Notebook name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div className="flex gap-2 mt-3">
                  <button className="btn btn-ac flex-1">Create</button>
                  <button
                    type="button"
                    className="btn btn-pl"
                    onClick={() => {
                      setAdding(false);
                      setName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="nb nb-new" onClick={() => setAdding(true)}>
                <span className="t">+ New notebook</span>
              </button>
            )}
          </div>

          <h3 className="text-2xl mb-3">Recent</h3>
          {recent.recent.length === 0 ? (
            <p className="opacity-70">Documents you edit will show up here.</p>
          ) : (
            <div>
              {recent.recent.map((d) => (
                <Link key={d._id} to={`/doc/${d._id}`} className="recent-row">
                  <span>
                    <b>{d.title}</b> <small className="opacity-60">· {d.workspaceName}</small>
                  </span>
                  <small className="opacity-70 whitespace-nowrap">{timeAgo(d.updatedAt)}</small>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}