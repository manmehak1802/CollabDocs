import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (path, body) => {
    const { data } = await api.post(path, body);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (name, email, password) =>
    authenticate('/auth/register', { name, email, password });
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  const updateName = (name) => setUser((u) => ({ ...u, name }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}