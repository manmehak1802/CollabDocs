import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils/time';

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
    <Link ref={ref} to={`/workspace/${w._id}`} onMouseMove={move} onMouseLeave={leave} className={`nb nb-${i % 4}`}>
      <span className="t">{w.name}</span>
      <small className="opacity-80">{n} member{n === 1 ? '' : 's'}</small>
    </Link>
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
  const people = new Set(list.flatMap((w) => w.members.map((m) => String(m.user))));
  people.delete(myId);
  const first = user.name.split(' ')[0];

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
      <p className="eye">Dashboard</p>
      <h1 className="text-5xl md:text-6xl mt-2 mb-8">
        Hey {first}, <span className="hl">ready to write?</span>
      </h1>

      <div className="grid sm:grid-cols-3 gap-5 mb-10">
        {[
          [list.length, 'notebooks'],
          [recent.total, 'documents'],
          [people.size, 'people you work with'],
        ].map(([n, label]) => (
          <div key={label} className="box">
            <b className="font-display text-5xl block leading-none">{n}</b>
            <span className="opacity-70">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-3xl">Your notebooks</h2>
        <Link to="/ask" className="btn btn-ac">Ask your notes</Link>
      </div>

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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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