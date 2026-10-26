import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Loading, bestFreeTotal, fmt } from './common.jsx';

export default function Overview({ configData, goTo }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api.overview().then(setStats, err => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const config = configData?.config;
  const habits = configData?.habits || [];
  // A free member earns only from the habits they pick in each group; best case is the highest-paying ones
  const groups = configData?.groups || [];
  const freeMax = config ? bestFreeTotal(config.habits, habits, groups, config.freeHabitLimits) : 0;
  const freePicks = config ? groups.map(g => `${config.freeHabitLimits[g.id]} ${g.name.toLowerCase()}`).join(' + ') : '';
  const premiumMax = config ? habits.reduce((s, h) => s + Math.round(config.habits[h.id].maxReward * config.premium.multiplier), 0) : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>Members, premium and FIT issued in the last 24 hours.</p>
        </div>
        <button className="btn sm" onClick={load}>
          Refresh
        </button>
      </div>

      {stats ? (
        <div className="stats">
          <div className="card stat">
            <div className="label">Members</div>
            <div className="value">{fmt(stats.users)}</div>
            <div className="hint">+{fmt(stats.newUsers24h)} in the last 24 h</div>
          </div>
          <div className="card stat">
            <div className="label">Premium members</div>
            <div className="value" style={{ color: 'var(--gold)' }}>
              {fmt(stats.premiumUsers)}
            </div>
            <div className="hint">{stats.users ? Math.round((stats.premiumUsers / stats.users) * 100) : 0}% of members</div>
          </div>
          <div className="card stat">
            <div className="label">FIT issued · 24 h</div>
            <div className="value">{fmt(stats.fitIssued24h)}</div>
            <div className="hint">{fmt(stats.premiumFitIssued24h)} to premium members</div>
          </div>
        </div>
      ) : (
        <Loading error={error} onRetry={load} />
      )}

      {config ? (
        <div className="grid-2">
          <div className="card">
            <div className="card-head">
              <h2>Free members</h2>
              <button className="btn sm" onClick={() => goTo('coins')}>
                Edit coins
              </button>
            </div>
            <p>
              Up to <span className="coin">{fmt(Math.min(freeMax, config.dailyCap))} FIT</span> a day from habits
            </p>
            <p className="muted small">
              Picks {freePicks} habits · best case {fmt(freeMax)} · daily cap {fmt(config.dailyCap)}
            </p>
          </div>
          <div className="card">
            <div className="card-head">
              <h2>
                Premium{' '}
                <span className={`badge ${config.premium.enabled ? 'gold' : ''}`}>{config.premium.enabled ? `${config.premium.multiplier}x rewards` : 'Off'}</span>
              </h2>
              <button className="btn sm" onClick={() => goTo('premium')}>
                Edit plan
              </button>
            </div>
            <p>
              Up to <span className="coin">{fmt(Math.min(premiumMax, config.premium.dailyCap))} FIT</span> a day from habits
            </p>
            <p className="muted small">
              {config.premium.currency} {fmt(config.premium.price)} for {config.premium.durationDays} days · daily cap {fmt(config.premium.dailyCap)}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
