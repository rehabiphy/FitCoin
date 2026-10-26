import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Loading, fmtDate } from './common.jsx';

export default function Members({ configData, notify }) {
  const [query, setQuery] = useState({ q: '', premium: 'all', page: 1 });
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const defaultDays = configData?.config.premium.durationDays || 30;

  const load = useCallback(() => {
    setError(null);
    api.users(query).then(setData, err => setError(err.message));
  }, [query]);

  useEffect(load, [load]);

  // Search as you type, after a short pause
  useEffect(() => {
    const t = setTimeout(() => setQuery(q => (q.q === search.trim() ? q : { ...q, q: search.trim(), page: 1 })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const replaceRow = user => setData(d => ({ ...d, items: d.items.map(u => (u.id === user.id ? user : u)) }));

  const grant = async u => {
    const answer = window.prompt(`Give ${u.name} premium for how many days?`, String(defaultDays));
    if (answer === null) {
      return;
    }
    const days = Number.parseInt(answer, 10);
    if (!(days >= 1 && days <= 3650)) {
      notify('Enter a number of days between 1 and 3650', false);
      return;
    }
    setBusyId(u.id);
    try {
      const { user } = await api.grantPremium(u.id, days);
      replaceRow(user);
      notify(`${u.name} has premium until ${fmtDate(user.premiumUntil)}`);
    } catch (err) {
      notify(err.message, false);
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async u => {
    if (!window.confirm(`End ${u.name}'s premium now?`)) {
      return;
    }
    setBusyId(u.id);
    try {
      const { user } = await api.revokePremium(u.id);
      replaceRow(user);
      notify(`${u.name}'s premium has ended`);
    } catch (err) {
      notify(err.message, false);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Members</h1>
          <p>Find members and give or end premium.</p>
        </div>
      </div>

      <div className="card">
        <div className="actions" style={{ marginBottom: 16 }}>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search name or email"
            aria-label="Search members"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="input"
            style={{ maxWidth: 160 }}
            aria-label="Filter by plan"
            value={query.premium}
            onChange={e => setQuery(q => ({ ...q, premium: e.target.value, page: 1 }))}>
            <option value="all">All members</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>
        </div>

        {!data ? (
          <Loading error={error} onRetry={load} />
        ) : data.items.length === 0 ? (
          <p className="muted">No members match.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Premium until</th>
                    <th>Joined</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="habit-name">
                          {u.name} {u.role === 'admin' ? <span className="badge primary">Admin</span> : null}
                        </div>
                        <div className="muted small">{u.email}</div>
                      </td>
                      <td>
                        {u.isPremium ? (
                          <span className="badge gold">♛ Premium{u.premiumSource === 'admin' ? ' · given' : ''}</span>
                        ) : (
                          <span className="badge">Free</span>
                        )}
                      </td>
                      <td className="num">{u.isPremium ? fmtDate(u.premiumUntil) : u.premiumUntil ? <span className="muted">Ended {fmtDate(u.premiumUntil)}</span> : '—'}</td>
                      <td className="num">{fmtDate(u.createdAt)}</td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn sm" disabled={busyId === u.id} onClick={() => grant(u)}>
                            {u.isPremium ? 'Extend' : 'Give premium'}
                          </button>
                          {u.isPremium ? (
                            <button className="btn sm danger" disabled={busyId === u.id} onClick={() => revoke(u)}>
                              End
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="muted small">
                {data.total} member{data.total === 1 ? '' : 's'} · page {data.page}
              </span>
              <div className="actions">
                <button className="btn sm" disabled={data.page <= 1} onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}>
                  Previous
                </button>
                <button className="btn sm" disabled={!data.hasMore} onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
