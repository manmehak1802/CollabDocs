import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/workspaces').then((res) => setWorkspaces(res.data));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await api.post('/workspaces', { name });
      setWorkspaces([data, ...workspaces]);
      setName('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create workspace');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl">
          Hey {user.name}, <span className="hl">ready to write?</span>
        </h1>
        <button className="btn" onClick={logout}>Log out</button>
      </div>

      <form onSubmit={create} className="flex gap-3 mb-8 max-w-md">
        <input className="input" placeholder="New notebook name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-ac">Create</button>
      </form>
      {error && <p className="mb-4 font-bold text-red-600">{error}</p>}

      <h2 className="text-2xl mb-4">Your notebooks</h2>
      {workspaces.length === 0 ? (
        <p className="opacity-70">No notebooks yet. Create your first one above.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {workspaces.map((w) => (
            <Link
              key={w._id}
              to={`/workspace/${w._id}`}
              className="box block hover:-translate-y-0.5 transition"
            >
              <h3 className="text-xl">{w.name}</h3>
              <p className="text-sm opacity-70">{w.members.length} member(s)</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}