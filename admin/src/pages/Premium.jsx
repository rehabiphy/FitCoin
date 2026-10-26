import { useEffect, useMemo, useState } from 'react';
import { LastSaved, Loading, Switch, fmt, isValidAmount, toNumber } from './common.jsx';

function toDraft(p) {
  return {
    enabled: p.enabled,
    showPopup: p.showPopup,
    title: p.title,
    tagline: p.tagline,
    multiplier: String(p.multiplier),
    dailyCap: String(p.dailyCap),
    price: String(p.price),
    currency: p.currency,
    durationDays: String(p.durationDays),
    benefits: p.benefits.join('\n'),
  };
}

function fromDraft(d) {
  return {
    enabled: d.enabled,
    showPopup: d.showPopup,
    title: d.title.trim(),
    tagline: d.tagline.trim(),
    multiplier: toNumber(d.multiplier),
    dailyCap: toNumber(d.dailyCap),
    price: toNumber(d.price),
    currency: d.currency.trim().toUpperCase(),
    durationDays: toNumber(d.durationDays),
    benefits: d.benefits
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean),
  };
}

function errorsOf(p) {
  const e = {};
  if (p.title.length < 2) e.title = 'At least 2 characters';
  if (!(p.multiplier >= 1 && p.multiplier <= 10)) e.multiplier = 'Between 1 and 10';
  if (!isValidAmount(p.dailyCap)) e.dailyCap = 'Enter 0 or more';
  if (!isValidAmount(p.price)) e.price = 'Enter 0 or more';
  if (!/^[A-Z]{3}$/.test(p.currency)) e.currency = '3 letters, e.g. INR';
  if (!(Number.isInteger(p.durationDays) && p.durationDays >= 1 && p.durationDays <= 3650)) e.durationDays = 'Whole days, 1–3650';
  if (p.benefits.length > 8) e.benefits = 'Up to 8 benefits';
  if (p.benefits.some(b => b.length > 120)) e.benefits = 'Keep each benefit under 120 characters';
  return e;
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <span className="error-text">{error}</span> : hint ? <span className="muted small">{hint}</span> : null}
    </div>
  );
}

export default function Premium({ configData, configError, reloadConfig, saveConfig }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configData) {
      setDraft(toDraft(configData.config.premium));
    }
  }, [configData]);

  const dirty = useMemo(
    () => configData && draft && JSON.stringify(toDraft(configData.config.premium)) !== JSON.stringify(draft),
    [configData, draft],
  );

  if (!configData || !draft) {
    return <Loading error={configError} onRetry={reloadConfig} />;
  }

  const { config, habits, meta } = configData;
  const plan = fromDraft(draft);
  const errors = errorsOf(plan);
  const set = key => e => setDraft(d => ({ ...d, [key]: e.target.value }));
  const m = Number.isFinite(plan.multiplier) ? plan.multiplier : 1;
  const premiumTotal = habits.reduce((s, h) => s + Math.round(config.habits[h.id].maxReward * m), 0);

  const save = async () => {
    setSaving(true);
    await saveConfig({ premium: plan });
    setSaving(false);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Premium</h1>
          <p>The plan members see in the app, and how much extra they earn.</p>
        </div>
        <div className="actions">
          <LastSaved meta={meta} />
          <button className="btn" disabled={!dirty || saving} onClick={() => setDraft(toDraft(config.premium))}>
            Discard
          </button>
          <button className="btn primary" disabled={!dirty || saving || Object.keys(errors).length > 0} onClick={save}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div className="card">
            <div className="toggle">
              <div>
                <div className="habit-name">Premium enabled</div>
                <div className="muted small">Off hides the upgrade offer and pauses the bonus for everyone.</div>
              </div>
              <Switch label="Premium enabled" on={draft.enabled} onChange={v => setDraft(d => ({ ...d, enabled: v }))} />
            </div>
            <div className="toggle">
              <div>
                <div className="habit-name">Upgrade pop-up on app launch</div>
                <div className="muted small">Shown once per launch to members who aren’t premium.</div>
              </div>
              <Switch label="Upgrade pop-up" on={draft.showPopup} onChange={v => setDraft(d => ({ ...d, showPopup: v }))} />
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 14 }}>Rewards</h2>
            <div className="grid-2">
              <Field id="mult" label="Reward multiplier" error={errors.multiplier} hint="2 = double FIT on every habit">
                <input id="mult" className={`input num ${errors.multiplier ? 'invalid' : ''}`} type="number" min="1" max="10" step="0.1" value={draft.multiplier} onChange={set('multiplier')} />
              </Field>
              <Field id="pcap" label="Premium daily cap (FIT)" error={errors.dailyCap} hint={`Free members: ${fmt(config.dailyCap)}`}>
                <input id="pcap" className={`input num ${errors.dailyCap ? 'invalid' : ''}`} type="number" min="0" value={draft.dailyCap} onChange={set('dailyCap')} />
              </Field>
            </div>
            <p className="notice" style={{ marginTop: 14 }}>
              With {m}x, habits pay premium members up to <b className="coin">{fmt(premiumTotal)} FIT</b> a day
              {Number.isFinite(plan.dailyCap) && premiumTotal > plan.dailyCap ? `, limited to ${fmt(plan.dailyCap)} by the cap` : ''}.
            </p>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 14 }}>Plan</h2>
            <div className="grid-2">
              <Field id="price" label="Price" error={errors.price}>
                <input id="price" className={`input num ${errors.price ? 'invalid' : ''}`} type="number" min="0" step="any" value={draft.price} onChange={set('price')} />
              </Field>
              <Field id="cur" label="Currency" error={errors.currency}>
                <input id="cur" className={`input ${errors.currency ? 'invalid' : ''}`} maxLength={3} value={draft.currency} onChange={set('currency')} />
              </Field>
              <Field id="days" label="Length (days)" error={errors.durationDays} hint="Buying again extends from the current end date">
                <input id="days" className={`input num ${errors.durationDays ? 'invalid' : ''}`} type="number" min="1" step="1" value={draft.durationDays} onChange={set('durationDays')} />
              </Field>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 14 }}>Text in the app</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field id="title" label="Title" error={errors.title}>
                <input id="title" className={`input ${errors.title ? 'invalid' : ''}`} maxLength={40} value={draft.title} onChange={set('title')} />
              </Field>
              <Field id="tag" label="Tagline">
                <input id="tag" className="input" maxLength={120} value={draft.tagline} onChange={set('tagline')} />
              </Field>
              <Field id="ben" label="Benefits (one per line)" error={errors.benefits}>
                <textarea id="ben" className={`input ${errors.benefits ? 'invalid' : ''}`} value={draft.benefits} onChange={set('benefits')} />
              </Field>
            </div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 24 }}>
          <p className="label-text" style={{ marginBottom: 8 }}>
            Preview
          </p>
          <div className="preview">
            <span className="badge" style={{ background: 'rgba(0,0,0,0.25)', color: '#FFD86B' }}>
              ♛ {m}x REWARDS
            </span>
            <h3>{plan.title || 'Premium'}</h3>
            <p style={{ opacity: 0.85, marginTop: 4 }}>{plan.tagline}</p>
            <ul>
              {plan.benefits.map(b => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="price">
              {plan.currency} {fmt(plan.price)} <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.8 }}>/ {plan.durationDays} days</span>
            </div>
          </div>
          {!draft.enabled ? <p className="muted small" style={{ marginTop: 10 }}>Premium is off — members won’t see this.</p> : null}
        </div>
      </div>
    </>
  );
}
