import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup' | 'reset';

export function AuthPage() {
  const { session, verified } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session && verified) return <Navigate to="/app" replace />;
  if (session && !verified) return <Navigate to="/verify-email" replace />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName },
            emailRedirectTo: `${window.location.origin}/app`
          }
        });
        if (signUpError) throw signUpError;
        setMessage('Check your inbox and verify your email before opening the workspace.');
      } else if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (signInError) throw signInError;
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/auth` });
        if (resetError) throw resetError;
        setMessage('Password reset instructions have been sent.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-paper md:grid-cols-[0.85fr_1fr]">
      <section className="hidden border-r border-stone-200 bg-[linear-gradient(160deg,#13201b_0%,#315144_55%,#b7663b_100%)] p-10 text-white md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-3 text-xl font-black"><ShieldCheck /> TrustDesk</Link>
        <div>
          <p className="text-sm font-bold uppercase text-white/70">Verified access only</p>
          <h1 className="mt-3 text-4xl font-black leading-tight">Protect vendor decisions with authenticated, auditable workflows.</h1>
        </div>
      </section>
      <section className="flex items-center justify-center p-5">
        <form className="panel w-full max-w-md p-7" onSubmit={submit}>
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-white"><Mail /></div>
          <h1 className="mt-5 text-2xl font-bold">{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}</h1>
          <div className="mt-6 grid gap-4">
            {mode === 'signup' && <label><span className="label">Full name</span><input className="field mt-1" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>}
            <label><span className="label">Email</span><input type="email" className="field mt-1" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            {mode !== 'reset' && <label><span className="label">Password</span><input type="password" className="field mt-1" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}
          </div>
          {message && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{message}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-900">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? 'Submitting...' : mode === 'reset' ? 'Send reset email' : 'Continue'}</button>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-moss">
            <button type="button" onClick={() => setMode('signin')} className="hover:text-signal">Sign in</button>
            <button type="button" onClick={() => setMode('signup')} className="hover:text-signal">Create account</button>
            <button type="button" onClick={() => setMode('reset')} className="hover:text-signal">Reset password</button>
          </div>
        </form>
      </section>
    </main>
  );
}
