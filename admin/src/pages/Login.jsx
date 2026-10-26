import { useState } from 'react';
import { API_LABEL, login } from '../api.js';

export default function Login({ onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await login(email.trim(), password));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card login" onSubmit={submit}>
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-mark">F</div>
          <div>
            Fitcoin
            <small>Admin panel</small>
          </div>
        </div>
        <p className="muted">
          Sign in with an admin account · <span className={`badge ${API_LABEL === 'Live' ? 'gold' : 'mint'}`}>{API_LABEL} API</span>
        </p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="muted small">
          No admin yet? In <code>backend/</code> run <code>npm run make-admin -- you@example.com</code> for an account created in the app.
        </p>
      </form>
    </div>
  );
}
