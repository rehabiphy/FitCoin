import { useEffect, useMemo, useState } from 'react';
import { LastSaved, Loading, bestFreeTotal, fmt, isValidAmount, toNumber } from './common.jsx';

const FIELDS = ['perUnit', 'maxReward', 'goal'];

const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

/** Config -> editable text values */
function toDraft(config) {
  return {
    dailyCap: String(config.dailyCap),
    freeHabitLimits: mapValues(config.freeHabitLimits, String),
    habits: Object.fromEntries(Object.entries(config.habits).map(([id, h]) => [id, Object.fromEntries(FIELDS.map(f => [f, String(h[f])]))])),
  };
}

function fromDraft(draft) {
  return {
    dailyCap: toNumber(draft.dailyCap),
    freeHabitLimits: mapValues(draft.freeHabitLimits, toNumber),
    habits: Object.fromEntries(Object.entries(draft.habits).map(([id, h]) => [id, Object.fromEntries(FIELDS.map(f => [f, toNumber(h[f])]))])),
  };
}

export default function HabitCoins({ configData, configError, reloadConfig, saveConfig }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configData) {
      setDraft(toDraft(configData.config));
    }
  }, [configData]);

  const dirty = useMemo(
    () => configData && draft && JSON.stringify(toDraft(configData.config)) !== JSON.stringify(draft),
    [configData, draft],
  );

  if (!configData || !draft) {
    return <Loading error={configError} onRetry={reloadConfig} />;
  }

  const { habits, groups, defaults, config, meta } = configData;
  const multiplier = config.premium.multiplier;

  const invalid = (id, f) => {
    const v = draft.habits[id][f];
    return f === 'goal' ? !(toNumber(v) > 0) : !isValidAmount(v);
  };
  const parsed = fromDraft(draft);
  const limitInvalid = g => {
    const n = parsed.freeHabitLimits[g.id];
    return !(Number.isInteger(n) && n >= 0 && n <= g.ids.length);
  };
  const noHabits = groups.every(g => !limitInvalid(g) && parsed.freeHabitLimits[g.id] === 0);
  const hasErrors =
    !isValidAmount(draft.dailyCap) || noHabits || groups.some(limitInvalid) || habits.some(h => FIELDS.some(f => invalid(h.id, f)));

  const setHabit = (id, field, value) => setDraft(d => ({ ...d, habits: { ...d.habits, [id]: { ...d.habits[id], [field]: value } } }));
  const setLimit = (g, value) => setDraft(d => ({ ...d, freeHabitLimits: { ...d.freeHabitLimits, [g]: value } }));

  // Best case for a free member: their picks are the highest-paying habits in each group
  const freeTotal = bestFreeTotal(parsed.habits, habits, groups, parsed.freeHabitLimits);
  const groupName = id => groups.find(g => g.id === id)?.name || '';

  const save = async () => {
    setSaving(true);
    await saveConfig(parsed);
    setSaving(false);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Habit coins</h1>
          <p>How much FIT each habit pays. Premium members get these × {multiplier}.</p>
        </div>
        <div className="actions">
          <LastSaved meta={meta} />
          <button
            className="btn"
            onClick={() =>
              setDraft(toDraft({ ...config, dailyCap: defaults.dailyCap, freeHabitLimits: defaults.freeHabitLimits, habits: defaults.habits }))
            }>
            Reset to defaults
          </button>
          <button className="btn" disabled={!dirty || saving} onClick={() => setDraft(toDraft(config))}>
            Discard
          </button>
          <button className="btn primary" disabled={!dirty || hasErrors || saving} onClick={save}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Habit</th>
                <th>Rate (FIT)</th>
                <th>Max FIT / day</th>
                <th>Daily goal</th>
                <th>Premium max / day</th>
              </tr>
            </thead>
            <tbody>
              {habits.map(h => {
                const row = draft.habits[h.id];
                const isGoal = h.rewardMode === 'goal';
                return (
                  <tr key={h.id}>
                    <td>
                      <div className="habit-name">
                        {h.name} <span className={`badge ${h.group === 'movement' ? 'mint' : 'primary'}`}>{groupName(h.group)}</span>
                      </div>
                      <div className="muted small">{isGoal ? 'Pays the max once the goal is met' : `Per ${h.rateUnit}, until the daily max`}</div>
                    </td>
                    <td>
                      {isGoal ? (
                        <span className="muted small">—</span>
                      ) : (
                        <div className="field">
                          <input
                            className={`input num ${invalid(h.id, 'perUnit') ? 'invalid' : ''}`}
                            type="number"
                            min="0"
                            step="any"
                            value={row.perUnit}
                            aria-label={`${h.name} FIT per ${h.rateUnit}`}
                            onChange={e => setHabit(h.id, 'perUnit', e.target.value)}
                          />
                          <span className="muted small">per {h.rateUnit}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        className={`input num ${invalid(h.id, 'maxReward') ? 'invalid' : ''}`}
                        type="number"
                        min="0"
                        step="any"
                        value={row.maxReward}
                        aria-label={`${h.name} max FIT per day`}
                        onChange={e => setHabit(h.id, 'maxReward', e.target.value)}
                      />
                    </td>
                    <td>
                      <div className="field">
                        <input
                          className={`input num ${invalid(h.id, 'goal') ? 'invalid' : ''}`}
                          type="number"
                          min="0"
                          step="any"
                          value={row.goal}
                          aria-label={`${h.name} daily goal`}
                          onChange={e => setHabit(h.id, 'goal', e.target.value)}
                        />
                        <span className="muted small">{h.id === 'walk' ? 'steps (default; members can set their own)' : h.unit}</span>
                      </div>
                    </td>
                    <td>
                      <span className="coin num">{fmt(Math.round((parsed.habits[h.id].maxReward || 0) * multiplier))} FIT</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="cap">Daily cap for free members (FIT)</label>
            <input
              id="cap"
              className={`input num ${!isValidAmount(draft.dailyCap) ? 'invalid' : ''}`}
              type="number"
              min="0"
              value={draft.dailyCap}
              onChange={e => setDraft(d => ({ ...d, dailyCap: e.target.value }))}
            />
            <span className="muted small">Most FIT a free member can earn from all habits in one day. Premium has its own cap on the Premium page.</span>
          </div>
          {groups.map(g => (
            <div className="field" key={g.id}>
              <label htmlFor={`limit-${g.id}`}>Free members pick — {g.name}</label>
              <input
                id={`limit-${g.id}`}
                className={`input num ${limitInvalid(g) || noHabits ? 'invalid' : ''}`}
                type="number"
                min="0"
                max={g.ids.length}
                step="1"
                value={draft.freeHabitLimits[g.id]}
                onChange={e => setLimit(g.id, e.target.value)}
              />
              <span className={limitInvalid(g) || noHabits ? 'error-text' : 'muted small'}>
                {limitInvalid(g)
                  ? `Whole number from 0 to ${g.ids.length}`
                  : noHabits
                  ? 'Free members need at least one habit'
                  : `${parsed.freeHabitLimits[g.id]} of ${g.ids.length}: ${habits
                      .filter(h => h.group === g.id)
                      .map(h => h.name)
                      .join(', ')}`}
              </span>
            </div>
          ))}
          <div className="notice">
            Free members can earn up to <b className="coin">{fmt(Math.min(freeTotal, Number.isFinite(parsed.dailyCap) ? parsed.dailyCap : freeTotal))} FIT</b> a
            day if they pick the best-paying habits in each group
            {Number.isFinite(parsed.dailyCap) && freeTotal > parsed.dailyCap ? ` (${fmt(freeTotal)}, limited by the cap)` : ''}. Premium members earn from
            all {habits.length} habits. Changes apply to new activity right away (today’s rewards only ever go up, never down).
          </div>
        </div>
      </div>
    </>
  );
}
