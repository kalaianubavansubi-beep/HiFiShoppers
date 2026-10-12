import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { signIn } from '../lib/api';
import { supabaseConfigProblems } from '../lib/supabase';

export default function LoginPage() {
  const { user, isAdmin, backendConfigured, authReady, signOut, profileError } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  if (authReady && user && isAdmin) return <Navigate to="/admin" replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      await signIn(email.trim(), password);
      navigate('/admin');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page-shell auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <ShieldAlert size={28} />
          <h1>Admin sign in</h1>
        </div>

        {!backendConfigured && (
          <div className="form-status" role="alert">
            <p>Supabase is not configured in this build, so admin sign-in is disabled.</p>
            <ul className="plain-list">
              {supabaseConfigProblems.map((problem) => (
                <li key={problem}>• {problem}</li>
              ))}
            </ul>
            <p>
              Fix: set both variables in Netlify (scope must include <strong>Builds</strong>), then trigger a new deploy
              with “Clear cache and deploy site”. Variables are baked in at build time.
            </p>
          </div>
        )}

        {user && !isAdmin && authReady && (
          <p className="form-status">
            Signed in as {user.email}, but this account has no admin role
            {profileError ? ` (${profileError})` : '. Ask the owner to run: update public.profiles set role = \'admin\' where email = \'' + user.email + '\';'}{' '}
            <button type="button" className="text-button" onClick={signOut}>Sign out</button>
          </p>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" autoComplete="username" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" required />
          <button type="submit" className="button button-primary" disabled={busy || !backendConfigured}>
            <LogIn size={18} />
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {status && <p className="form-status" role="alert">{status}</p>}
      </div>
    </div>
  );
}
