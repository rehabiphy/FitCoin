import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Loading, Switch, fmt, isValidAmount, toNumber } from './common.jsx';

const GROUPS = [
  { id: 'habits', title: 'Habit rewards', note: 'Base values come from the Habit coins page.' },
  { id: 'caps', title: 'Daily caps', note: 'Base values come from the Habit coins and Premium pages.' },
  { id: 'bonuses', title: 'Streak & referral bonuses', note: '' },
  { id: 'challenges', title: 'Challenge prizes', note: '' },
];

const round2 = n => Math.round(n * 100) / 100;

/** 0 -> "Full", 1 -> "½", 2 -> "¼", 3 -> "⅛", then "1/16" … */
export function fractionLabel(era) {
  return ['Full', '½', '¼', '⅛'][era] || `1/${2 ** era}`;
}

const pct = factor => `${round2(factor * 100)}%`;

/** Data from the API -> editable text values */
function toDraft(data) {
  return {
    auto: data.autoAtUsers !== null,
    autoAtUsers: data.autoAtUsers !== null ? String(data.autoAtUsers) : '',
    overrides: Object.fromEntries(data.parts.map(p => [p.key, p.override !== null ? String(p.override) : ''])),
  };
}

function fromDraft(draft) {
  return {
    autoAtUsers: draft.auto ? toNumber(draft.autoAtUsers) : null,
    overrides: Object.fromEntries(
      Object.entries(draft.overrides)
        .filter(([, v]) => String(v).trim() !== '')
        .map(([k, v]) => [k, toNumber(v)]),
    ),
  };
}

export default function Halving({ notify, reloadConfig }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback(next => {
    setData(next);
    setDraft(toDraft(next));
    setError(null);
  }, []);

  const load = useCallback(() => {
    setError(null);
    api.halving().then(apply, err => setError(err.message));
  }, [apply]);

  useEffect(load, [load]);

  const dirty = useMemo(() => data && draft && JSON.stringify(toDraft(data)) !== JSON.stringify(draft), [data, draft]);

  if (!data || !draft) {
    return <Loading error={error} onRetry={load} />;
  }

  const { era, factor, users, parts, history, maxEra } = data;
  const nextFactor = factor / 2;
  const parsed = fromDraft(draft);

  const overrideInvalid = key => String(draft.overrides[key]).trim() !== '' && !isValidAmount(draft.overrides[key]);
  const autoInvalid = draft.auto && !(Number.isInteger(parsed.autoAtUsers) && parsed.autoAtUsers > users);
  const hasErrors = autoInvalid || parts.some(p => overrideInvalid(p.key));

  const setOverride = (key, value) => setDraft(d => ({ ...d, overrides: { ...d.overrides, [key]: value } }));
  const fixedCount = Object.keys(parsed.overrides).length;

  /** Runs a halving action, then refreshes this page and the shared config. */
  const run = async (fn, done) => {
    setBusy(true);
    try {
      apply(await fn());
      reloadConfig();
      notify(done);
    } catch (err) {
      notify(err.message, false);
      if (err.code === 'HALVING_CHANGED') {
        load();
      }
    }
    setBusy(false);
  };

  const halveNow = () => {
    if (dirty) {
      notify('Save or discard your changes first.', false);
      return;
    }
    const sample = parts.find(p => p.key === 'habit.walk.perUnit');
    const ok = window.confirm(
      `Halve all FIT rewards now?\n\nMembers will get ${fractionLabel(era + 1)} of the base values (${pct(nextFactor)}).` +
        (sample ? `\nExample: ${sample.label} ${fmt(sample.halved)} → ${fmt(round2(sample.base * nextFactor))} FIT.` : '') +
        (fixedCount ? `\n\n${fixedCount} fixed amount${fixedCount === 1 ? '' : 's'} won’t change.` : '') +
        '\n\nThis applies to new rewards within a few seconds. FIT already earned is not touched.',
    );
    if (ok) {
      run(() => api.halve(era), `Rewards halved — members now get ${pct(nextFactor)} of base values.`);
    }
  };

  const undo = () => {
    if (dirty) {
      notify('Save or discard your changes first.', false);
      return;
    }
    if (window.confirm(`Undo the last halving? Members will get ${pct(factor * 2)} of base values again.`)) {
      run(() => api.undoHalving(era), 'Last halving undone.');
    }
  };

  const save = () => run(() => api.saveHalving({ fromEra: era, ...parsed }), 'Saved — the app picks this up within a few seconds.');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Halving</h1>
          <p>Halve every FIT reward at once as the community grows. Pin any reward to a fixed amount below.</p>
        </div>
        <div className="actions">
          <button className="btn" disabled={busy || era === 0} onClick={undo}>
            Undo last halving
          </button>
          <button className="btn danger" disabled={busy || era >= maxEra} onClick={halveNow}>
            Halve rewards now
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="card stat">
          <div className="label">Members get</div>
          <div className="value" style={{ color: era ? 'var(--gold)' : undefined }}>
            {pct(factor)}
          </div>
          <div className="hint">{era === 0 ? 'Full base values — never halved' : `${fractionLabel(era)} of base values`}</div>
        </div>
        <div className="card stat">
          <div className="label">Halvings so far</div>
          <div className="value">{era}</div>
          <div className="hint">Next: {pct(nextFactor)} of base values</div>
        </div>
        <div className="card stat">
          <div className="label">Members</div>
          <div className="value">{fmt(users)}</div>
          <div className="hint">
            {data.autoAtUsers ? `Auto-halves at ${fmt(data.autoAtUsers)} (${fmt(Math.max(0, data.autoAtUsers - users))} to go)` : 'No automatic halving set'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Automatic halving</h2>
        </div>
        <div className="grid-2">
          <div className="toggle">
            <div>
              <div className="habit-name">Halve when members reach a target</div>
              <div className="muted small">Fires once when that member count is reached, then switches off. Set the next target afterwards.</div>
            </div>
            <Switch on={draft.auto} label="Automatic halving" onChange={on => setDraft(d => ({ ...d, auto: on }))} />
          </div>
          <div className="field">
            <label htmlFor="auto-users">Member target</label>
            <input
              id="auto-users"
              className={`input num ${autoInvalid ? 'invalid' : ''}`}
              type="number"
              min={users + 1}
              step="1"
              placeholder="e.g. 100000"
              disabled={!draft.auto}
              value={draft.autoAtUsers}
              onChange={e => setDraft(d => ({ ...d, autoAtUsers: e.target.value }))}
            />
            <span className={autoInvalid ? 'error-text' : 'muted small'}>
              {autoInvalid ? `Whole number above the current ${fmt(users)} members` : `Currently ${fmt(users)} members`}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Rewards</h2>
            <p className="muted small">
              Leave “Fixed amount” empty to follow halving. A fixed amount is paid exactly as entered and isn’t changed by future halvings. Premium
              members still get their multiplier on habit rewards.
            </p>
          </div>
          <div className="actions">
            <button className="btn" disabled={!dirty || busy} onClick={() => setDraft(toDraft(data))}>
              Discard
            </button>
            <button className="btn primary" disabled={!dirty || hasErrors || busy} onClick={save}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reward</th>
                <th>Base (FIT)</th>
                <th>Halved now</th>
                <th>Fixed amount</th>
                <th>Members get</th>
                <th>After next halving</th>
              </tr>
            </thead>
            {GROUPS.map(g => {
              const rows = parts.filter(p => p.group === g.id);
              if (!rows.length) {
                return null;
              }
              return (
                <tbody key={g.id}>
                  <tr>
                    <td colSpan={6}>
                      <span className="habit-name">{g.title}</span> {g.note ? <span className="muted small">· {g.note}</span> : null}
                    </td>
                  </tr>
                  {rows.map(p => {
                    const text = draft.overrides[p.key];
                    const fixed = String(text).trim() !== '' && isValidAmount(text) ? toNumber(text) : null;
                    const live = fixed ?? p.halved;
                    const next = fixed ?? round2(p.base * nextFactor);
                    return (
                      <tr key={p.key}>
                        <td>
                          <div>{p.label}</div>
                          <div className="muted small">{p.detail}</div>
                        </td>
                        <td className="num">{fmt(p.base)}</td>
                        <td className="num">{fmt(p.halved)}</td>
                        <td>
                          <div className="field">
                            <input
                              className={`input num ${overrideInvalid(p.key) ? 'invalid' : ''}`}
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Follows halving"
                              value={text}
                              aria-label={`${p.label} fixed amount`}
                              onChange={e => setOverride(p.key, e.target.value)}
                            />
                            {fixed !== null ? (
                              <button className="btn sm" type="button" onClick={() => setOverride(p.key, '')}>
                                Clear
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className="coin num">{fmt(live)} FIT</span> {fixed !== null ? <span className="badge gold">Fixed</span> : null}
                        </td>
                        <td className="num muted">{fmt(next)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>History</h2>
        </div>
        {history.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Change</th>
                  <th>Members get</th>
                  <th>Members then</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.at).toLocaleString('en-IN')}</td>
                    <td>
                      {h.action === 'undo' ? 'Undo' : 'Halved'} {h.auto ? <span className="badge mint">Automatic</span> : null}
                    </td>
                    <td className="num">{pct(0.5 ** h.era)}</td>
                    <td className="num">{fmt(h.users)}</td>
                    <td>{h.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No halvings yet — members get the full base values.</p>
        )}
      </div>
    </>
  );
}
