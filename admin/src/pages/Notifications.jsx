import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Loading, fmt } from './common.jsx';

const AUDIENCES = [
  { id: 'all', label: 'All members' },
  { id: 'premium', label: 'Premium members' },
  { id: 'free', label: 'Free members' },
];

// Screen the app opens when the notification is tapped (must match the backend's list)
const ROUTES = [
  { id: 'Notifications', label: 'Notification list' },
  { id: 'Home', label: 'Home' },
  { id: 'Activity', label: 'Today’s activity' },
  { id: 'Challenges', label: 'Challenges' },
  { id: 'Wallet', label: 'Wallet' },
  { id: 'Premium', label: 'Premium' },
  { id: 'Referral', label: 'Invite friends' },
  { id: 'Leaderboard', label: 'Leaderboard' },
];

const EMPTY = { title: '', body: '', audience: 'all', route: 'Notifications' };

export default function Notifications({ notify }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api.notifications().then(setInfo, err => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  const valid = form.title.trim().length >= 3 && form.body.trim().length >= 5;
  const audienceLabel = AUDIENCES.find(a => a.id === form.audience)?.label.toLowerCase();

  const send = async e => {
    e.preventDefault();
    if (!valid || !window.confirm(`Send this announcement to ${audienceLabel}? This can’t be undone.`)) {
      return;
    }
    setSending(true);
    try {
      const { result } = await api.sendAnnouncement(form);
      notify(`Sent to ${fmt(result.members)} members · ${fmt(result.sent)} phones reached`);
      setForm(EMPTY);
      load();
    } catch (err) {
      notify(err.message, false);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p>Send important announcements. Habit reminders and health tips go out automatically.</p>
        </div>
        <button className="btn sm" onClick={load}>
          Refresh
        </button>
      </div>

      {info ? (
        <div className="stats">
          <div className="card stat">
            <div className="label">Push</div>
            <div className="value" style={{ color: info.enabled ? 'var(--mint)' : 'var(--danger)' }}>
              {info.enabled ? 'On' : 'Off'}
            </div>
            <div className="hint">{info.enabled ? 'Firebase connected' : 'Set FIREBASE_SERVICE_ACCOUNT on the server'}</div>
          </div>
          <div className="card stat">
            <div className="label">Members reachable</div>
            <div className="value">{fmt(info.users)}</div>
            <div className="hint">signed in on at least one phone</div>
          </div>
          <div className="card stat">
            <div className="label">Phones</div>
            <div className="value">{fmt(info.devices)}</div>
            <div className="hint">registered for push</div>
          </div>
        </div>
      ) : (
        <Loading error={error} onRetry={load} />
      )}

      <form className="card" onSubmit={send}>
        <div className="card-head">
          <h2>New announcement</h2>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="n-audience">Send to</label>
            <select id="n-audience" className="input" value={form.audience} onChange={set('audience')}>
              {AUDIENCES.map(a => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="n-route">Opens when tapped</label>
            <select id="n-route" className="input" value={form.route} onChange={set('route')}>
              {ROUTES.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="n-title">Title ({form.title.length}/80)</label>
          <input id="n-title" className="input" maxLength={80} value={form.title} onChange={set('title')} placeholder="New: cycling challenges are live 🚴" />
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="n-body">Message ({form.body.length}/300)</label>
          <textarea id="n-body" className="input" maxLength={300} value={form.body} onChange={set('body')} placeholder="Join this week’s cycling challenge and earn bonus axyio." />
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          Announcements are saved in every member’s notification list and pushed to their phones, even if they turned off reminders or tips.
          Keep them for things that matter.
        </p>
        <button className="btn primary" style={{ marginTop: 14 }} disabled={!valid || sending}>
          {sending ? 'Sending…' : 'Send announcement'}
        </button>
      </form>

      {info?.history?.length ? (
        <div className="card">
          <div className="card-head">
            <h2>Recent announcements</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sent</th>
                  <th>Announcement</th>
                  <th>Audience</th>
                  <th className="num">Members</th>
                  <th className="num">Phones reached</th>
                </tr>
              </thead>
              <tbody>
                {info.history.map(h => (
                  <tr key={`${h.sentAt}-${h.title}`}>
                    <td className="small">
                      {new Date(h.sentAt).toLocaleString('en-IN')}
                      <div className="muted">{h.by}</div>
                    </td>
                    <td>
                      <div className="habit-name">{h.title}</div>
                      <div className="muted small">{h.body}</div>
                    </td>
                    <td>{AUDIENCES.find(a => a.id === h.audience)?.label || h.audience}</td>
                    <td className="num">{fmt(h.members)}</td>
                    <td className="num">
                      {fmt(h.sent)}
                      {h.failed ? <div className="muted small">{fmt(h.failed)} failed</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
