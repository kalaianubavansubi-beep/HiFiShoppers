import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

// UI guard only. The real enforcement is Row Level Security in Supabase (see migration 002).
export default function ProtectedRoute({ children }) {
  const { user, isAdmin, authReady } = useStore();

  if (!authReady) return <div className="container page-shell"><p>Checking access…</p></div>;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return children;
}
