import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('in');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'in') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="box w-full max-w-sm">
        <h1 className="text-3xl mb-1">
          collab<span className="hl">docs</span>
        </h1>
        <p className="opacity-70 mb-5 text-sm">
          {mode === 'in' ? 'Welcome back.' : 'Create your account.'}
        </p>

        <div className="flex gap-2 mb-5">
          {[['in', 'Log in'], ['up', 'Sign up']].map(([m, label]) => (
            <button
              type="button"
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 font-bold text-sm border-2 border-ink rounded-xl ${
                mode === m ? 'bg-ink text-paper' : 'bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'up' && (
          <>
            <label className="text-xs font-bold uppercase">Name</label>
            <input className="input mb-3 mt-1" value={form.name} onChange={set('name')} required />
          </>
        )}
        <label className="text-xs font-bold uppercase">Email</label>
        <input className="input mb-3 mt-1" type="email" value={form.email} onChange={set('email')} required />
        <label className="text-xs font-bold uppercase">Password</label>
        <input className="input mb-4 mt-1" type="password" minLength={6} value={form.password} onChange={set('password')} required />

        {error && <p className="mb-3 font-bold text-sm text-red-600">{error}</p>}

        <button className="btn btn-ac w-full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'in' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}