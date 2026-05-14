import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function VerifyEmailPage() {
  const { session, verified, signOut } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session) return <Navigate to="/auth" replace />;
  if (verified) return <Navigate to="/app" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <section className="panel max-w-lg p-7 text-center">
        <MailCheck className="mx-auto text-signal" size={42} />
        <h1 className="mt-5 text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm leading-6 text-moss">TrustDesk blocks private workspaces until Supabase confirms your email address. Use the verification link sent to {session.user.email}.</p>
        {message && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{message}</p>}
        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-900">{error}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="btn-primary flex-1"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError('');
              setMessage('');
              const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: session.user.email ?? '' });
              setLoading(false);
              if (resendError) setError(resendError.message);
              else setMessage('Verification email sent again.');
            }}
          >
            {loading ? 'Sending...' : 'Resend email'}
          </button>
          <button className="btn-secondary flex-1" onClick={signOut}>Use another account</button>
        </div>
      </section>
    </main>
  );
}
