import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ACCENTS, currentAccent, saveAccent } from '../utils/accent';

export default function Settings() {
  const { user, updateName, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [accent, setAccent] = useState(currentAccent());
  const [name, setName] = useState(user.name);
  const [books, setBooks] = useState([]);
  const [sel, setSel] = useState(null);
  const [ws, setWs] = useState(null);
  const [role, setRole] = useState(null);
  const [invite, setInvite] = useState({ email: '', role: 'editor' });
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    api.get('/workspaces').then((r) => {
      setBooks(r.data);
      if (r.data[0]) setSel(r.data[0]._id);
    });
  }, []);

  const load = async (id) => {
    try {
      const { data } = await api.get(`/workspaces/${id}`);
      setWs(data.workspace);
      setRole(data.role);
    } catch {
      setWs(null);
    }
  };

  useEffect(() => {
    if (sel) load(sel);
  }, [sel]);

  const pickAccent = (c) => {
    setAccent(c);
    saveAccent(c);
    toast('Accent updated');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/me', { name });
      updateName(data.user.name);
      toast('Profile saved');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not save');
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await api.put(`/workspaces/${sel}/members/${userId}`, { role: newRole });
      toast('Role updated');
      load(sel);
    } catch (err) {
      toast(err.response?.data?.message || 'Could not change role');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member from the notebook?')) return;
    try {
      await api.delete(`/workspaces/${sel}/members/${userId}`);
      toast('Member removed');
      load(sel);
    } catch (err) {
      toast(err.response?.data?.message || 'Could not remove member');
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/workspaces/${sel}/members`, invite);
      toast('Member added');
      setInvite({ email: '', role: 'editor' });
      load(sel);
    } catch (err) {
      toast(err.response?.data?.message || 'Could not invite');
    }
  };

  const toggleAI = async (on) => {
    setAiBusy(true);
    try {
      await api.put(`/workspaces/${sel}/settings`, { aiEnabled: on });
      setWs({ ...ws, aiEnabled: on });
      if (on) {
        const { data } = await api.post(`/ai/workspaces/${sel}/reindex`);
        toast(`AI on · indexed ${data.indexed} document(s)`);
      } else {
        toast('AI is off for this notebook');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Could not change the AI setting');
    } finally {
      setAiBusy(false);
    }
  };

  const isOwner = role === 'owner';
  const myId = String(user._id || user.id);

  return (
    <div className="max-w-3xl">
      <p className="eye">Settings</p>
      <h1 className="text-5xl md:text-6xl mt-2 mb-8">
        Make it <span className="hl">yours</span>
      </h1>

      <div className="box mb-6">
        <h3 className="text-2xl mb-3">Accent colour</h3>
        <div className="sws">
          {ACCENTS.map((c) => (
            <button
              key={c}
              aria-label={`Accent ${c}`}
              className={accent === c ? 'on' : ''}
              style={{ background: c }}
              onClick={() => pickAccent(c)}
            />
          ))}
        </div>
        <p className="opacity-70 text-sm mt-3">Changes buttons, links and live indicators everywhere.</p>
      </div>

      <form onSubmit={saveProfile} className="box mb-6">
        <h3 className="text-2xl mb-3">Profile</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase">Name</label>
            <input className="input mt-1" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Email</label>
            <input className="input mt-1 opacity-60" value={user.email || ''} readOnly />
          </div>
        </div>
        <button className="btn btn-ac mt-4">Save profile</button>
      </form>

      <div className="box mb-6">
        <h3 className="text-2xl mb-3">Notebook settings</h3>
        {books.length === 0 ? (
          <p className="opacity-70">Create a notebook first, then manage its members here.</p>
        ) : (
          <>
            <div className="seg mb-4">
              {books.map((b) => (
                <button key={b._id} className={sel === b._id ? 'act' : ''} onClick={() => setSel(b._id)}>
                  {b.name}
                </button>
              ))}
            </div>

            {ws && (
              <>
                <p className="eye mb-1">Members · you are {role}</p>
                <div className="mb-4">
                  {ws.members.map((m) => {
                    const mine = String(m.user._id) === myId;
                    return (
                      <div key={m.user._id} className="row-line">
                        <span>
                          {m.user.name} {mine && <span className="chip" style={{ margin: 0, cursor: 'default' }}>You</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          {isOwner && m.role !== 'owner' ? (
                            <>
                              <select
                                className="input"
                                style={{ width: 'auto', padding: '.35rem .7rem' }}
                                value={m.role}
                                onChange={(e) => changeRole(m.user._id, e.target.value)}
                              >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <button className="tbtn" onClick={() => removeMember(m.user._id)}>Remove</button>
                            </>
                          ) : (
                            <b className="text-sm">{m.role}</b>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {isOwner && (
                  <form onSubmit={sendInvite} className="flex flex-wrap gap-3 mb-6">
                    <input
                      className="input flex-1 min-w-48"
                      type="email"
                      placeholder="Invite by email"
                      value={invite.email}
                      onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                      required
                    />
                    <select
                      className="input"
                      style={{ width: 'auto' }}
                      value={invite.role}
                      onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button className="btn btn-ac">Invite</button>
                  </form>
                )}

                <div className="row-line">
                  <span>
                    <b>Let AI read this notebook</b>
                    <br />
                    <small className="opacity-70">
                      {isOwner
                        ? ws.aiEnabled === false
                          ? 'AI is off. Nothing from this notebook is indexed.'
                          : 'Documents are indexed so you can ask questions about them.'
                        : 'Only the owner can change this.'}
                    </small>
                  </span>
                  <label className="sw">
                    <input
                      type="checkbox"
                      checked={ws.aiEnabled !== false}
                      disabled={!isOwner || aiBusy}
                      onChange={(e) => toggleAI(e.target.checked)}
                    />
                    <i />
                  </label>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="box">
        <h3 className="text-2xl mb-3">Account</h3>
        <button
          className="btn btn-pl"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}