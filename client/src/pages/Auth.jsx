import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const strength = (p) => (p.length >= 6 ? 1 : 0) + (p.length >= 10 ? 1 : 0) + (/[A-Z]/.test(p) && /\d/.test(p) ? 1 : 0);
const LABELS = ['Password strength', 'Weak', 'Okay', 'Strong'];

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState('in');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [shake, setShake] = useState(0);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const fail = (msg) => {
    toast(msg);
    setShake((n) => n + 1);
  };

  const display = form.name.trim() || form.email.split('@')[0].trim() || 'Your name';
  const initial = display === 'Your name' ? '?' : display[0].toUpperCase();
  const score = strength(form.password);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const { name, email, password } = form;
    if (mode === 'up' && !name.trim()) return fail('Add your name first');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return fail('Enter a valid email');
    if (password.length < 6) return fail('Password needs 6+ characters');

    setBusy(true);
    try {
      if (mode === 'in') await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      setApproved(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      fail(err.response?.data?.message || 'Could not reach the server');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-12 pt-7">
        <Link to="/" className="font-display text-4xl md:text-5xl font-extrabold">
          collab<span className="hl">docs</span>
        </Link>
      </header>

      <main className="flex-1 grid md:grid-cols-2 gap-8 md:gap-16 items-center w-full max-w-6xl mx-auto px-6 md:px-12 py-8">
        {/* ID badge that fills in as you type */}
        <div className="lan">
          <div className="badge">
            <div className="hole" />
            <div className="ph">{initial}</div>
            <h3 className="text-2xl">{display}</h3>
            <p>{form.email || 'you@example.com'}</p>
            <div className={`stamp ${approved ? 'on' : ''}`}>Approved</div>
          </div>
        </div>

        {/* heading and form */}
        <div>
          <p className="eye">{mode === 'in' ? 'Welcome back' : 'Join CollabDocs'}</p>
          <h1 className="text-5xl md:text-6xl my-3">
            {mode === 'in' ? (
              <>Good to see <span className="hl">you</span>.</>
            ) : (
              <>Let’s make <span className="hl">your badge</span>.</>
            )}
          </h1>
          <p className="opacity-70 mb-6 max-w-md">
            {mode === 'in'
              ? 'Log in to open your notebooks and ask your notes.'
              : 'Create an account to start your first notebook.'}
          </p>

          <div key={shake} className={shake ? 'shk' : ''}>
            <form onSubmit={submit} noValidate className="box p-6 md:p-8">
              <div className="flex gap-2 mb-5">
                {[['in', 'Log in'], ['up', 'Sign up']].map(([m, label]) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 font-bold border-2 border-ink rounded-xl ${
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
                  <input className="input mt-1 mb-4" value={form.name} onChange={set('name')} placeholder="Manmehak" />
                </>
              )}
              <label className="text-xs font-bold uppercase">Email</label>
              <input className="input mt-1 mb-4" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              <label className="text-xs font-bold uppercase">Password</label>
              <input className="input mt-1 mb-3" type="password" value={form.password} onChange={set('password')} placeholder="6+ characters" />
              <div className="meter"><i style={{ width: `${(score / 3) * 100}%` }} /></div>
              <p className="text-xs opacity-70 mb-5">{LABELS[score]}</p>

              <button className="btn btn-ac w-full py-3" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'in' ? 'Log in' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}