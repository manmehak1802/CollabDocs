import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Notebook from './pages/Notebook';
import DocPage from './pages/DocPage';
import Ask from './pages/Ask';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const guard = (el) => (
  <ProtectedRoute>
    <AppLayout>{el}</AppLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={guard(<Dashboard />)} />
            <Route path="/workspace/:id" element={guard(<Notebook />)} />
            <Route path="/doc/:id" element={guard(<DocPage />)} />
            <Route path="/ask" element={guard(<Ask />)} />
            <Route path="/settings" element={guard(<Settings />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}