import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

export default function Notebook() {
  const { id } = useParams();
  const [ws, setWs] = useState(null);
  const [role, setRole] = useState(null);
  const [docs, setDocs] = useState([]);
  const [q, setQ] = useState('');
  const [title, setTitle] = useState('');
  const [invite, setInvite] = useState({ email: '', role: 'editor' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

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
    load();
  }, [id]);

  const createDoc = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/workspaces/${id}/documents`, { title });
      setDocs([data, ...docs]);
      setTitle('');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not create document');
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/workspaces/${id}/members`, invite);
      setMsg('Member added');
      setInvite({ email: '', role: 'editor' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not invite');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member from the notebook?')) return;
    try {
      await api.delete(`/workspaces/${id}/members/${userId}`);
      setMsg('Member removed');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not remove member');
    }
  };

  if (error) return <p className="p-8 font-bold text-red-600">{error}</p>;
  if (!ws) return <p className="p-8 font-bold">Loading…</p>;

  const canEdit = role !== 'viewer';
  const shown = docs.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link to="/dashboard" className="font-bold underline">← Dashboard</Link>
      <div className="flex flex-wrap justify-between items-end gap-3 my-4">
        <div>
          <p className="text-xs font-bold uppercase opacity-60">Notebook · you are {role}</p>
          <h1 className="text-4xl">{ws.name}</h1>
        </div>
      </div>

      {msg && <p className="mb-4 font-bold">{msg}</p>}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {canEdit && (
            <form onSubmit={createDoc} className="flex gap-3 mb-4">
              <input className="input" placeholder="New document title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <button className="btn btn-ac whitespace-nowrap">+ New doc</button>
            </form>
          )}
          <input className="input mb-4" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} />

          {shown.length === 0 ? (
            <p className="opacity-70">No documents yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {shown.map((d) => (
                <Link key={d._id} to={`/doc/${d._id}`} className="box block hover:-translate-y-0.5 transition">
                  <h3 className="text-lg">{d.title}</h3>
                  <p className="text-xs opacity-70 mt-1">
                    Edited by {d.lastEditedBy?.name || 'unknown'} · {new Date(d.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="box h-fit">
          <h3 className="text-xl mb-3">Members</h3>
          {ws.members.map((m) => (
            <div key={m.user._id} className="flex justify-between items-center gap-2 text-sm py-2 border-t-2 border-ink">
              <span>{m.user.name}</span>
              <span className="flex items-center gap-2">
                <span className="font-bold">{m.role}</span>
                {role === 'owner' && m.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => removeMember(m.user._id)}
                    className="px-2 py-0.5 border-2 border-ink rounded-lg font-bold text-xs bg-white hover:bg-hl"
                  >
                    Remove
                  </button>
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
      </div>
    </div>
  );
}