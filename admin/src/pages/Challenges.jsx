import { useCallback, useEffect, useMemo, useState } from 'react';
import { Footprints, Droplet, Bike, Wind, BookOpen, Moon, Flame, Trophy, Target, Zap, Heart, Mountain, Sun, Timer, Star, Medal, Dumbbell, Leaf, Coffee, Sparkles } from 'lucide-react';
import { api } from '../api.js';
import { Loading, Switch, fmt, isValidAmount, toNumber } from './common.jsx';

// The icons the backend lets admins pick (config/challenges.js CHALLENGE_ICONS), same names as the app's lucide icons
const Lucide = { Footprints, Droplet, Bike, Wind, BookOpen, Moon, Flame, Trophy, Target, Zap, Heart, Mountain, Sun, Timer, Star, Medal, Dumbbell, Leaf, Coffee, Sparkles };

const PERIODS = [
  { id: 'daily', label: 'Daily', hint: 'Restarts every day at local midnight' },
  { id: 'weekly', label: 'Weekly', hint: 'Restarts every Monday (Mon–Sun)' },
  { id: 'custom', label: 'Event', hint: 'Runs once between two dates' },
];
const periodLabel = p => PERIODS.find(x => x.id === p)?.label || p;

// Same colour pairs the app uses for its built-in challenges
const GRADIENTS = [
  ['#34F5B4', '#22D3EE'],
  ['#4D8DFF', '#7C5CFF'],
  ['#22D3EE', '#4D8DFF'],
  ['#FF5C9A', '#FF8A3D'],
  ['#FFD86B', '#FF8A3D'],
  ['#7C5CFF', '#22D3EE'],
  ['#FF5C9A', '#7C5CFF'],
  ['#34F5B4', '#7C5CFF'],
];

// Which habit the form starts on gives a sensible icon and colours
const HABIT_LOOK = {
  walk: { icon: 'Footprints', gradient: GRADIENTS[0] },
  water: { icon: 'Droplet', gradient: GRADIENTS[1] },
  cycle: { icon: 'Bike', gradient: GRADIENTS[2] },
  breathe: { icon: 'Wind', gradient: GRADIENTS[3] },
  read: { icon: 'BookOpen', gradient: GRADIENTS[4] },
  sleep: { icon: 'Moon', gradient: GRADIENTS[6] },
};

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDays = (key, n) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const fmtDay = key => (key ? new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const minutesToTime = m => (m == null || m === '' ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
const timeToMinutes = t => {
  if (!t) {
    return null;
  }
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmtTime = m => new Date(2000, 0, 1, Math.floor(m / 60), m % 60).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export function ChallengeIcon({ name, gradient, size = 44 }) {
  const Cmp = Lucide[name] || Lucide.Sparkles;
  return (
    <span className="ch-icon" style={{ width: size, height: size, borderRadius: size * 0.33, background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}>
      <Cmp size={size * 0.48} color="#fff" strokeWidth={2.2} />
    </span>
  );
}

/** "10,000 steps on 7 days", "50 km in total", "One 5 min breathing session before 9:00 AM" */
function goalSummary(c, activities) {
  const a = activities.find(x => x.id === c.activity);
  const unit = a?.unit || '';
  const name = a?.name.toLowerCase() || '';
  const target = toNumber(c.target);
  if (c.goalType === 'days') {
    return `${fmt(toNumber(c.dailyTarget))} ${unit} on ${fmt(target)} day${target === 1 ? '' : 's'}`;
  }
  if (c.goalType === 'session') {
    return `One ${name} session of ${fmt(target)} ${unit}${c.startBefore ? ` started before ${fmtTime(c.startBefore)}` : ''}`;
  }
  return `${fmt(target)} ${unit} of ${name} in total`;
}

/** Live, Paused, Scheduled or Ended, from the admin's own calendar day. */
function statusOf(c) {
  if (c.archived) {
    return { label: 'Archived', cls: '' };
  }
  if (!c.active) {
    return { label: 'Paused', cls: '' };
  }
  if (c.period === 'custom') {
    const today = localToday();
    if (today < c.startDate) {
      return { label: `Starts ${fmtDay(c.startDate)}`, cls: 'primary' };
    }
    if (today > c.endDate) {
      return { label: 'Ended', cls: '' };
    }
  }
  return { label: 'Live', cls: 'mint' };
}

const runLength = f => (f.period === 'daily' ? 1 : f.period === 'weekly' ? 7 : f.startDate && f.endDate ? Math.round((new Date(f.endDate) - new Date(f.startDate)) / 86400000) + 1 : 0);

function emptyForm() {
  const today = localToday();
  return {
    title: '',
    description: '',
    period: 'weekly',
    startDate: today,
    endDate: addDays(today, 6),
    activity: 'walk',
    goalType: 'total',
    dailyTarget: '',
    startBefore: '',
    target: '',
    unitLabel: '',
    reward: '',
    icon: HABIT_LOOK.walk.icon,
    gradient: HABIT_LOOK.walk.gradient,
    active: true,
  };
}

const toForm = c => ({
  ...c,
  startDate: c.startDate || localToday(),
  endDate: c.endDate || addDays(localToday(), 6),
  dailyTarget: c.dailyTarget ?? '',
  startBefore: minutesToTime(c.startBefore),
  target: String(c.target),
  reward: String(c.reward),
});

function validate(f, options) {
  const e = {};
  if (f.title.trim().length < 3) {
    e.title = 'At least 3 characters';
  }
  if (f.description.trim().length < 5) {
    e.description = 'At least 5 characters';
  }
  const goal = options.goalTypes.find(g => g.id === f.goalType);
  if (goal && !goal.activities.includes(f.activity)) {
    e.goalType = 'This habit has no timed sessions';
  }
  if (f.period === 'custom') {
    if (!f.startDate || !f.endDate) {
      e.endDate = 'Pick both dates';
    } else if (f.endDate < f.startDate) {
      e.endDate = 'Ends before it starts';
    } else if (runLength(f) > 366) {
      e.endDate = 'At most a year';
    }
  }
  const target = toNumber(f.target);
  if (!(target > 0)) {
    e.target = 'Must be above 0';
  } else if (f.goalType === 'days') {
    if (!Number.isInteger(target)) {
      e.target = 'Whole number of days';
    } else if (runLength(f) && target > runLength(f)) {
      e.target = `This run only has ${runLength(f)} day${runLength(f) === 1 ? '' : 's'}`;
    }
  }
  if (f.goalType === 'days' && !(toNumber(f.dailyTarget) > 0)) {
    e.dailyTarget = 'Must be above 0';
  }
  if (!isValidAmount(f.reward)) {
    e.reward = 'Enter a prize (0 or more)';
  }
  return e;
}

function toPayload(f) {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    period: f.period,
    ...(f.period === 'custom' ? { startDate: f.startDate, endDate: f.endDate } : {}),
    icon: f.icon,
    gradient: f.gradient,
    activity: f.activity,
    goalType: f.goalType,
    ...(f.goalType === 'days' ? { dailyTarget: toNumber(f.dailyTarget) } : {}),
    startBefore: f.goalType === 'session' ? timeToMinutes(f.startBefore) : null,
    target: toNumber(f.target),
    unitLabel: f.unitLabel.trim(),
    reward: toNumber(f.reward),
    active: f.active,
    ...(f.sort !== undefined ? { sort: f.sort } : {}),
  };
}

/** How the challenge card looks in the app's Challenges tab. */
function AppPreview({ f, unit }) {
  const daily = f.period === 'daily';
  return (
    <div className="ch-preview">
      <div className="ch-preview-top">
        <ChallengeIcon name={f.icon} gradient={f.gradient} size={52} />
        <div>
          <span className={`badge ${daily ? 'cyan' : 'primary'}`}>{periodLabel(f.period)}</span>
          <div className="ch-preview-title">{f.title || 'Challenge title'}</div>
        </div>
      </div>
      <p className="ch-preview-desc">{f.description || 'What members have to do.'}</p>
      <div className="ch-preview-meta">
        <span className="muted small">0 joined · target {f.target || '—'} {f.unitLabel || unit}</span>
        <span className="badge gold">⚡ {f.reward || 0}</span>
      </div>
    </div>
  );
}

function Editor({ initial, options, halving, onCancel, onSaved, notify }) {
  const [f, setF] = useState(initial.id ? toForm(initial) : emptyForm());
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors = validate(f, options);
  const valid = Object.keys(errors).length === 0;
  const err = k => (touched ? errors[k] : null);

  const activity = options.activities.find(a => a.id === f.activity);
  const unit = f.goalType === 'days' ? 'days' : activity?.unit || '';
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const setActivity = id => {
    setF(prev => {
      const next = { ...prev, activity: id };
      // Keep the look in step with the habit until the admin picks one themselves
      const fromLook = Object.values(HABIT_LOOK).some(l => l.icon === prev.icon);
      if (!initial.id && fromLook && HABIT_LOOK[id]) {
        Object.assign(next, HABIT_LOOK[id]);
      }
      const goal = options.goalTypes.find(g => g.id === prev.goalType);
      if (goal && !goal.activities.includes(id)) {
        next.goalType = 'total';
      }
      return next;
    });
  };

  const save = async e => {
    e.preventDefault();
    setTouched(true);
    if (!valid) {
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(f);
      const { challenge } = initial.id ? await api.updateChallenge(initial.id, payload) : await api.createChallenge(payload);
      notify(initial.id ? 'Challenge saved — members see it on their next refresh.' : 'Challenge created.');
      onSaved(challenge);
    } catch (ex) {
      notify(ex.message, false);
    } finally {
      setSaving(false);
    }
  };

  const factor = halving ? 0.5 ** halving.era : 1;
  const fixed = initial.prizeFixed;

  return (
    <form className="card" onSubmit={save} noValidate>
      <div className="card-head">
        <h2>{initial.id ? `Edit “${initial.title}”` : 'New challenge'}</h2>
        <div className="actions">
          <button type="button" className="btn sm" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary sm" disabled={saving || (touched && !valid)}>
            {saving ? 'Saving…' : initial.id ? 'Save changes' : 'Create challenge'}
          </button>
        </div>
      </div>

      {initial.id && initial.joins ? (
        <div className="notice" style={{ marginBottom: 16 }}>
          {fmt(initial.joins)} members have joined this challenge. Changing the goal re-measures their current progress; anyone already paid keeps their
          prize.
        </div>
      ) : null}

      <div className="ch-editor">
        <div className="ch-fields">
          <h3 className="ch-section">Basics</h3>
          <div className="field">
            <label htmlFor="c-title">Title ({f.title.length}/60)</label>
            <input id="c-title" className={`input ${err('title') ? 'invalid' : ''}`} maxLength={60} value={f.title} onChange={e => set('title', e.target.value)} placeholder="Weekend Warrior" />
            {err('title') ? <span className="error-text">{err('title')}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="c-desc">Description ({f.description.length}/200)</label>
            <textarea
              id="c-desc"
              className={`input ${err('description') ? 'invalid' : ''}`}
              style={{ minHeight: 70 }}
              maxLength={200}
              value={f.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Walk 25,000 steps between Saturday and Sunday."
            />
            {err('description') ? <span className="error-text">{err('description')}</span> : null}
          </div>

          <h3 className="ch-section">Schedule</h3>
          <div className="seg">
            {PERIODS.map(p => (
              <button type="button" key={p.id} className={f.period === p.id ? 'on' : ''} onClick={() => set('period', p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="muted small">{PERIODS.find(p => p.id === f.period).hint}. Times follow each member’s phone time zone.</p>
          {f.period === 'custom' ? (
            <div className="grid-2">
              <div className="field">
                <label htmlFor="c-start">Starts</label>
                <input id="c-start" type="date" className="input" value={f.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="c-end">Ends (inclusive)</label>
                <input id="c-end" type="date" className={`input ${err('endDate') ? 'invalid' : ''}`} value={f.endDate} min={f.startDate} onChange={e => set('endDate', e.target.value)} />
                {err('endDate') ? <span className="error-text">{err('endDate')}</span> : null}
              </div>
            </div>
          ) : null}

          <h3 className="ch-section">Goal</h3>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="c-activity">Habit tracked</label>
              <select id="c-activity" className="input" value={f.activity} onChange={e => setActivity(e.target.value)}>
                {options.activities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="c-goal">Counted as</label>
              <select id="c-goal" className={`input ${err('goalType') ? 'invalid' : ''}`} value={f.goalType} onChange={e => set('goalType', e.target.value)}>
                {options.goalTypes.map(g => (
                  <option key={g.id} value={g.id} disabled={!g.activities.includes(f.activity)}>
                    {g.name}
                    {g.activities.includes(f.activity) ? '' : ' (not for this habit)'}
                  </option>
                ))}
              </select>
              {err('goalType') ? <span className="error-text">{err('goalType')}</span> : null}
            </div>
          </div>
          <div className="grid-2">
            {f.goalType === 'days' ? (
              <div className="field">
                <label htmlFor="c-daily">Needed each day ({activity?.unit})</label>
                <input id="c-daily" className={`input ${err('dailyTarget') ? 'invalid' : ''}`} inputMode="decimal" value={f.dailyTarget} onChange={e => set('dailyTarget', e.target.value)} placeholder="10000" />
                {err('dailyTarget') ? <span className="error-text">{err('dailyTarget')}</span> : null}
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="c-target">
                Target ({f.goalType === 'days' ? 'days' : f.goalType === 'session' ? `${activity?.unit} in one session` : `${activity?.unit} in total`})
              </label>
              <input id="c-target" className={`input ${err('target') ? 'invalid' : ''}`} inputMode="decimal" value={f.target} onChange={e => set('target', e.target.value)} placeholder={f.goalType === 'days' ? '5' : '50'} />
              {err('target') ? <span className="error-text">{err('target')}</span> : null}
            </div>
            {f.goalType === 'session' ? (
              <div className="field">
                <label htmlFor="c-before">Must start before (optional)</label>
                <input id="c-before" type="time" className="input" value={f.startBefore} onChange={e => set('startBefore', e.target.value)} />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="c-unit">Progress label</label>
              <input id="c-unit" className="input" maxLength={20} value={f.unitLabel} onChange={e => set('unitLabel', e.target.value)} placeholder={unit} />
            </div>
          </div>
          {!errors.target && !errors.dailyTarget ? <p className="muted small">Members complete it with: {goalSummary({ ...f, startBefore: timeToMinutes(f.startBefore) }, options.activities)}.</p> : null}

          <h3 className="ch-section">Prize</h3>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="c-reward">Base prize (FIT)</label>
              <input id="c-reward" className={`input ${err('reward') ? 'invalid' : ''}`} inputMode="decimal" value={f.reward} onChange={e => set('reward', e.target.value)} placeholder="200" />
              {err('reward') ? <span className="error-text">{err('reward')}</span> : null}
            </div>
            <div className="field">
              <span className="label-text">Members get today</span>
              <div className="ch-paid">
                {fixed ? (
                  <>
                    <b className="coin">{fmt(initial.prize)}</b> <span className="muted small">fixed on the Halving page</span>
                  </>
                ) : (
                  <>
                    <b className="coin">{isValidAmount(f.reward) ? fmt(Math.round(toNumber(f.reward) * factor * 100) / 100) : '—'}</b>{' '}
                    {halving?.era ? <span className="muted small">after {halving.era} halving{halving.era === 1 ? '' : 's'}</span> : null}
                  </>
                )}
              </div>
            </div>
          </div>

          <h3 className="ch-section">Look</h3>
          <div className="field">
            <span className="label-text">Icon</span>
            <div className="ch-icons">
              {options.icons.map(name => {
                const Cmp = Lucide[name] || Lucide.Sparkles;
                return (
                  <button type="button" key={name} title={name} className={`ch-pick ${f.icon === name ? 'on' : ''}`} onClick={() => set('icon', name)}>
                    <Cmp size={18} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <span className="label-text">Colours</span>
            <div className="ch-icons">
              {GRADIENTS.map(g => (
                <button
                  type="button"
                  key={g.join()}
                  title={g.join(' → ')}
                  className={`ch-pick ch-swatch ${f.gradient.join() === g.join() ? 'on' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
                  onClick={() => set('gradient', g)}
                />
              ))}
              <label className="ch-custom-color" title="Custom colours">
                <input type="color" value={f.gradient[0]} onChange={e => set('gradient', [e.target.value.toUpperCase(), f.gradient[1]])} />
                <input type="color" value={f.gradient[1]} onChange={e => set('gradient', [f.gradient[0], e.target.value.toUpperCase()])} />
              </label>
            </div>
          </div>

          <div className="toggle">
            <div>
              <div className="habit-name">Live in the app</div>
              <div className="muted small">Off saves it as paused, hidden from members until you turn it on.</div>
            </div>
            <Switch on={f.active} onChange={v => set('active', v)} label="Live in the app" />
          </div>
        </div>

        <div className="ch-side">
          <span className="label-text">App preview</span>
          <AppPreview f={f} unit={unit} />
        </div>
      </div>
    </form>
  );
}

export default function Challenges({ notify, goTo }) {
  const [data, setData] = useState(null); // { challenges, options }
  const [halving, setHalving] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // {} for new, row for edit
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api.challenges().then(setData, err => setError(err.message));
    api.config().then(c => setHalving(c.halving), () => {});
  }, []);

  useEffect(load, [load]);

  const replaceRow = row => setData(d => ({ ...d, challenges: d.challenges.some(c => c.id === row.id) ? d.challenges.map(c => (c.id === row.id ? row : c)) : [...d.challenges, row] }));

  const setStatus = async (c, change, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) {
      return;
    }
    setBusy(c.id);
    try {
      const { challenge } = await api.setChallengeStatus(c.id, change);
      replaceRow(challenge);
      notify(change.archived ? 'Archived.' : change.archived === false ? 'Restored as paused — turn it on when ready.' : challenge.active ? 'Challenge is live.' : 'Challenge paused.');
    } catch (err) {
      notify(err.message, false);
    } finally {
      setBusy(null);
    }
  };

  const rows = useMemo(() => (data?.challenges || []).filter(c => c.archived === showArchived), [data, showArchived]);
  const archivedCount = (data?.challenges || []).filter(c => c.archived).length;
  const live = (data?.challenges || []).filter(c => statusOf(c).label === 'Live').length;

  if (!data) {
    return (
      <>
        <div className="page-head">
          <h1>Challenges</h1>
        </div>
        <Loading error={error} onRetry={load} />
      </>
    );
  }

  if (editing) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Challenges</h1>
            <p>Set the goal, schedule and prize. The app shows changes on its next refresh.</p>
          </div>
        </div>
        <Editor
          initial={editing}
          options={data.options}
          halving={halving}
          notify={notify}
          onCancel={() => setEditing(null)}
          onSaved={row => {
            replaceRow(row);
            setEditing(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Challenges</h1>
          <p>Create daily, weekly and one-off event challenges. Progress is measured from members’ tracked habits.</p>
        </div>
        <div className="actions">
          <button className="btn sm" onClick={load}>
            Refresh
          </button>
          <button className="btn primary" onClick={() => setEditing({})}>
            + New challenge
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="card stat">
          <div className="label">Live now</div>
          <div className="value">{fmt(live)}</div>
          <div className="hint">visible in the app</div>
        </div>
        <div className="card stat">
          <div className="label">Joins</div>
          <div className="value">{fmt(data.challenges.reduce((s, c) => s + c.joins, 0))}</div>
          <div className="hint">all runs, all time</div>
        </div>
        <div className="card stat">
          <div className="label">Prizes paid</div>
          <div className="value coin">{fmt(data.challenges.reduce((s, c) => s + c.paid, 0))}</div>
          <div className="hint">FIT · {fmt(data.challenges.reduce((s, c) => s + c.completions, 0))} completions</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>{showArchived ? 'Archived challenges' : 'Challenges'}</h2>
          {archivedCount || showArchived ? (
            <button className="btn sm" onClick={() => setShowArchived(s => !s)}>
              {showArchived ? 'Back to challenges' : `Archived (${archivedCount})`}
            </button>
          ) : null}
        </div>
        {halving?.era ? (
          <p className="muted small" style={{ marginBottom: 12 }}>
            Prizes are halved like every other reward: members get the amount in gold.{' '}
            <button className="linkish" onClick={() => goTo('halving')}>
              Fix a prize on the Halving page
            </button>
          </p>
        ) : null}
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Schedule</th>
                  <th>Goal</th>
                  <th className="num">Prize</th>
                  <th className="num">Joins</th>
                  <th className="num">Done</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const st = statusOf(c);
                  return (
                    <tr key={c.id} style={!c.active ? { opacity: 0.7 } : undefined}>
                      <td>
                        <div className="ch-row">
                          <ChallengeIcon name={c.icon} gradient={c.gradient} size={38} />
                          <div>
                            <div className="habit-name">{c.title}</div>
                            <span className={`badge ${st.cls}`}>{st.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="small">
                        {periodLabel(c.period)}
                        {c.period === 'custom' ? (
                          <div className="muted">
                            {fmtDay(c.startDate)} – {fmtDay(c.endDate)}
                          </div>
                        ) : null}
                      </td>
                      <td className="small">{goalSummary(c, data.options.activities)}</td>
                      <td className="num">
                        <span className="coin">{fmt(c.prize)}</span>
                        {c.prize !== c.reward || c.prizeFixed ? <div className="muted small">{c.prizeFixed ? 'fixed' : `base ${fmt(c.reward)}`}</div> : null}
                      </td>
                      <td className="num">{fmt(c.joins)}</td>
                      <td className="num">{fmt(c.completions)}</td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {c.archived ? (
                            <button className="btn sm" disabled={busy === c.id} onClick={() => setStatus(c, { archived: false })}>
                              Restore
                            </button>
                          ) : (
                            <>
                              <button className="btn sm" onClick={() => setEditing(c)}>
                                Edit
                              </button>
                              <button className="btn sm" disabled={busy === c.id} onClick={() => setStatus(c, { active: !c.active })}>
                                {c.active ? 'Pause' : 'Go live'}
                              </button>
                              <button
                                className="btn sm danger"
                                disabled={busy === c.id}
                                onClick={() =>
                                  setStatus(c, { archived: true }, `Archive “${c.title}”? It disappears from the app. Prizes already paid are kept, and you can restore it later.`)
                                }>
                                Archive
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">{showArchived ? 'Nothing archived.' : 'No challenges yet — create the first one.'}</p>
        )}
      </div>
    </>
  );
}
