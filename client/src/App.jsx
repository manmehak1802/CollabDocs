import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Notebook from './pages/Notebook';
import DocPage from './pages/DocPage';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/workspace/:id" element={guard(<Notebook />)} />
          <Route path="/doc/:id" element={guard(<DocPage />)} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}