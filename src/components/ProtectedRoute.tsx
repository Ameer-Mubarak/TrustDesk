import { Navigate, Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { loading, session, verified } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div className="panel p-6 text-sm text-moss">Restoring your secure session...</div>
      </main>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!verified) return <Navigate to="/verify-email" replace />;

  return <Outlet />;
}
