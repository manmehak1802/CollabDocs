import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const readPins = (id) => {
  try {
    return JSON.parse(localStorage.getItem(`pins:${id}`)) || [];
  } catch {
    return [];
  }
};

export default function Notebook() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const myId = String(user._id || user.id);

  const [ws, setWs] = useState(null);
  const [role, setRole] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [pins, setPins] = useState(() => readPins(id));
  const [title, setTitle] = useState('');
  const [invite, setInvite] = useState({ email: '', role: 'editor' });
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');

  const load = async () => {
    try {
      const [w, d] = await Promise.all([
        api.get(`/workspaces/${id}`),
        api.get(`/workspaces/${id}/documents`),
      ]);
      setWs(w.data.workspace);
      setRole(w.data.role);
      setDocs(d.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load notebook');
    }
  };

  useEffect(() => {
    setPins(readPins(id));
    setConfirming(false);
    setTyped('');
    load();
  }, [id]);

  const savePins = (next) => {
    setPins(next);
    try {
      localStorage.setItem(`pins:${id}`, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const togglePin = (docId) => {
    const was = pins.includes(docId);
    savePins(was ? pins.filter((p) => p !== docId) : [docId, ...pins]);
    toast(was ? 'Unpinned' : 'Pinned');
  };

  const createDoc = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/workspaces/${id}/documents`, { title });
      toast('Document created');
      navigate(`/doc/${data._id}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Could not create document');
    }
  };

  const removeDoc = async (d) => {
    if (!window.confirm(`Delete “${d.title}”? This cannot be undone.`)) return;
    try {
      await api.delete(`/documents/${d._id}`);
      setDocs((list) => list.filter((x) => x._id !== d._id));
      if (pins.includes(d._id)) savePins(pins.filter((p) => p !== d._id));
      toast('Document deleted');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete document');
    }
  };

  const deleteNotebook = async () => {
    try {
      await api.delete(`/workspaces/${id}`);
      try {
        if (localStorage.getItem('lastNotebook') === id) localStorage.removeItem('lastNotebook');
        localStorage.removeItem(`pins:${id}`);
      } catch {
        /* ignore */
      }
      toast('Notebook deleted');
      navigate('/dashboard');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete notebook');
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/workspaces/${id}/members`, invite);
      toast('Member added');
      setInvite({ email: '', role: 'editor' });
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Could not invite');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member from the notebook?')) return;
    try {
      await api.delete(`/workspaces/${id}/members/${userId}`);
      toast('Member removed');
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Could not remove member');
    }
  };

  if (error) return <p className="font-bold text-red-600">{error}</p>;
  if (!ws) return <p className="font-bold">Loading…</p>;

  const canEdit = role !== 'viewer';
  const match = (d) =>
    d.title.toLowerCase().includes(q.toLowerCase()) &&
    (filter !== 'mine' || String(d.createdBy) === myId);
  const shown = docs.filter(match);
  const pinned = shown.filter((d) => pins.includes(d._id));
  const rest = filter === 'pinned' ? [] : shown.filter((d) => !pins.includes(d._id));

  const card = (d) => {
    const canDelete = role === 'owner' || String(d.createdBy) === myId;
    return (
      <Link key={d._id} to={`/doc/${d._id}`} className="box block relative hover:-translate-y-1">
        <button
          type="button"
          className={`pin ${pins.includes(d._id) ? 'on' : ''}`}
          aria-label="Pin document"
          onClick={(e) => {
            e.preventDefault();
            togglePin(d._id);
          }}
        >
          {pins.includes(d._id) ? '★' : '☆'}
        </button>
        <h3 className="text-2xl pr-8">{d.title}</h3>
        <div className="flex justify-between items-end gap-2 mt-2">
          <p className="text-sm opacity-70">
            Edited by {d.lastEditedBy?.name || 'unknown'} · {new Date(d.updatedAt).toLocaleDateString()}
          </p>
          {canDelete && (
            <button
              type="button"
              className="tbtn"
              onClick={(e) => {
                e.preventDefault();
                removeDoc(d);
              }}
            >
              Delete
            </button>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div>
      <Link to="/dashboard" className="font-bold underline">← Dashboard</Link>

      <div className="flex flex-wrap justify-between items-end gap-4 mt-4 mb-8">
        <div>
          <p className="eye">Notebook · you are {role}</p>
          <h1 className="text-4xl md:text-5xl mt-2">{ws.name}</h1>
        </div>
        <span className="flex -space-x-2">
          {ws.members.slice(0, 5).map((m) => (
            <span
              key={m.user._id}
              title={m.user.name}
              className="w-10 h-10 rounded-full border-2 border-ink bg-hl font-bold flex items-center justify-center"
            >
              {m.user.name[0].toUpperCase()}
            </span>
          ))}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_21rem] gap-8 items-start">
        <div>
          {canEdit && (
            <form onSubmit={createDoc} className="flex gap-3 mb-5">
              <input className="input" placeholder="New document title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <button className="btn btn-ac whitespace-nowrap">+ New doc</button>
            </form>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <input className="input max-w-xs" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div>
              {[['all', 'All'], ['mine', 'Mine'], ['pinned', 'Pinned']].map(([k, label]) => (
                <button key={k} type="button" className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {pinned.length > 0 && (
            <>
              <h3 className="text-2xl mb-3">Pinned</h3>
              <div className="grid sm:grid-cols-2 gap-5 mb-8">{pinned.map(card)}</div>
            </>
          )}

          {filter !== 'pinned' && (
            <>
              <h3 className="text-2xl mb-3">All documents</h3>
              {rest.length === 0 ? (
                <p className="opacity-70">No documents here yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">{rest.map(card)}</div>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="box">
            <h3 className="text-2xl mb-3">Members</h3>
            {ws.members.map((m) => (
              <div key={m.user._id} className="flex justify-between items-center gap-2 py-2.5 border-t-2 border-ink">
                <span>{m.user.name}</span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-sm">{m.role}</span>
                  {role === 'owner' && m.role !== 'owner' && (
                    <button type="button" className="tbtn" onClick={() => removeMember(m.user._id)}>Remove</button>
                  )}
                </span>
              </div>
            ))}
            {role === 'owner' && (
              <form onSubmit={sendInvite} className="mt-4 space-y-2">
                <input className="input" type="email" placeholder="Teammate email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} required />
                <select className="input" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button className="btn w-full">Invite</button>
              </form>
            )}
          </div>

          {role === 'owner' && (
            <div className="box">
              <h3 className="text-2xl mb-2">Delete notebook</h3>
              {!confirming ? (
                <>
                  <p className="text-sm opacity-70 mb-3">
                    Permanently deletes this notebook, all its documents and its AI index, for every member.
                  </p>
                  <button className="btn btn-pl" style={{ color: '#dc2626' }} onClick={() => setConfirming(true)}>
                    Delete notebook
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm mb-2">
                    This cannot be undone. Type <b>{ws.name}</b> to confirm.
                  </p>
                  <input
                    autoFocus
                    className="input mb-3"
                    placeholder={ws.name}
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn btn-pl flex-1"
                      style={{ color: '#dc2626' }}
                      disabled={typed.trim() !== ws.name}
                      onClick={deleteNotebook}
                    >
                      Delete forever
                    </button>
                    <button
                      className="btn btn-pl"
                      onClick={() => {
                        setConfirming(false);
                        setTyped('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}