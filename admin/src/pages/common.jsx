/** Shared bits for the admin pages. */

export function Loading({ error, onRetry }) {
  if (error) {
    return (
      <div className="card">
        <p className="error-text">{error}</p>
        {onRetry ? (
          <button className="btn sm" style={{ marginTop: 12 }} onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }
  return <p className="muted">Loading…</p>;
}

export function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export const fmt = n => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—');

export const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** "12" -> 12, "" / "abc" / negatives -> NaN, so inputs can stay as typed text */
export const toNumber = s => {
  if (typeof s === 'number') {
    return s;
  }
  const t = String(s ?? '').trim();
  return t === '' ? NaN : Number(t);
};

export const isValidAmount = s => {
  const n = toNumber(s);
  return Number.isFinite(n) && n >= 0;
};

/**
 * Most a free member can earn from habits in a day (before the cap): the
 * highest-paying habits they're allowed to pick in each group.
 */
export function bestFreeTotal(habitValues, habits, groups, limits) {
  return groups.reduce((sum, g) => {
    const best = habits
      .filter(h => h.group === g.id)
      .map(h => habitValues[h.id]?.maxReward || 0)
      .sort((a, b) => b - a)
      .slice(0, Number.isInteger(limits?.[g.id]) ? limits[g.id] : 0);
    return sum + best.reduce((s, v) => s + v, 0);
  }, 0);
}

export function LastSaved({ meta }) {
  if (!meta?.updatedAt) {
    return <span className="muted small">Using the built-in defaults</span>;
  }
  return (
    <span className="muted small">
      Last saved {new Date(meta.updatedAt).toLocaleString('en-IN')}
      {meta.updatedBy ? ` by ${meta.updatedBy.name}` : ''}
    </span>
  );
}

/** Shown on pages that edit base coin values once rewards have been halved. */
export function HalvingNotice({ halving, goTo }) {
  if (!halving?.era) {
    return null;
  }
  return (
    <div className="notice" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <span>
        Rewards have been halved {halving.era} time{halving.era === 1 ? '' : 's'}: members get{' '}
        <b className="coin">{Math.round(halving.factor * 10000) / 100}%</b> of the base values shown here
        {halving.fixed ? `, except ${halving.fixed} fixed amount${halving.fixed === 1 ? '' : 's'}` : ''}.
      </span>
      {goTo ? (
        <button className="btn sm" onClick={() => goTo('halving')}>
          Open Halving
        </button>
      ) : null}
    </div>
  );
}
