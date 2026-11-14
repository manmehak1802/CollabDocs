import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CommandPalette from './CommandPalette';

export default function AppLayout({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [palette, setPalette] = useState(false);
  const cls = ({ isActive }) => 'dock-btn' + (isActive ? ' on' : '');

  // Remember the last notebook you opened
  useEffect(() => {
    const m = pathname.match(/^\/workspace\/([^/]+)/);
    if (m) {
      try {
        localStorage.setItem('lastNotebook', m[1]);
      } catch {
        /* ignore */
      }
    }
  }, [pathname]);

  // "/" or Ctrl+K opens the palette (unless you are typing somewhere)
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t.matches?.('input, textarea, select') || t.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openNotebook = async () => {
    let id = null;
    try {
      id = localStorage.getItem('lastNotebook');
    } catch {
      /* ignore */
    }
    if (!id) {
      try {
        const { data } = await api.get('/workspaces');
        id = data[0]?._id;
      } catch {
        /* ignore */
      }
    }
    if (id) navigate(`/workspace/${id}`);
    else {
      toast('Create a notebook first');
      navigate('/dashboard');
    }
  };

  const inNotebook = pathname.startsWith('/workspace') || pathname.startsWith('/doc');

  return (
    <div className="min-h-screen pb-32">
      <header className="max-w-[100rem] mx-auto px-6 md:px-12 pt-6 flex justify-between items-center">
        <Link to="/dashboard" className="font-display text-4xl font-extrabold">
          collab<span className="hl">docs</span>
        </Link>
        <Link to="/settings" className="flex items-center gap-3 font-bold">
          <span className="eye hidden sm:block">{user?.name}</span>
          <span className="w-10 h-10 rounded-full border-2 border-ink bg-hl flex items-center justify-center">
            {user?.name?.[0]?.toUpperCase()}
          </span>
        </Link>
      </header>

      <main className="max-w-[100rem] mx-auto px-6 md:px-12 pt-8">{children}</main>

      <nav className="dock">
        <NavLink to="/dashboard" className={cls}>Home</NavLink>
        <button className={'dock-btn' + (inNotebook ? ' on' : '')} onClick={openNotebook}>Notebook</button>
        <NavLink to="/ask" className={cls}>Ask</NavLink>
        <NavLink to="/settings" className={cls}>Settings</NavLink>
        <button className="dock-btn" onClick={() => setPalette(true)}>Search /</button>
      </nav>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}