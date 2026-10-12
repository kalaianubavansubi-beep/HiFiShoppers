import { Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function ProtectedRoute({ children }) {
  const { user } = useStore();

  const isAuthorized = !!user && (user.email?.includes('admin') || user.email?.includes('manager'));

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
