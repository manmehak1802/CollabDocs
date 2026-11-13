import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cls = ({ isActive }) => 'dock-btn' + (isActive ? ' on' : '');

  return (
    <div className="min-h-screen pb-32">
      <header className="max-w-6xl mx-auto px-5 md:px-10 pt-6 flex justify-between items-center">
        <Link to="/dashboard" className="font-display text-3xl font-extrabold">
          collab<span className="hl">docs</span>
        </Link>
        <span className="eye hidden sm:block">{user?.name}</span>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-10 pt-8">{children}</main>

      <nav className="dock">
        <NavLink to="/dashboard" className={cls}>Home</NavLink>
        <NavLink to="/ask" className={cls}>Ask</NavLink>
        <button
          className="dock-btn"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          Log out
        </button>
      </nav>
    </div>
  );
}