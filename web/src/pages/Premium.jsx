import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import Accordion from '../components/Accordion.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { CAPS, FAQ, HABITS, PREMIUM } from '../site.js';

const ROWS = [
  ['Earn FIT for healthy habits', true, true],
  ['Active habits', '1 movement + 2 lifestyle', 'All 6'],
  ['FIT per habit', 'Standard rate', `${PREMIUM.multiplier}x rate`],
  ['Daily habit cap', `${CAPS.free} FIT`, `${CAPS.premium} FIT`],
  ['Streaks, challenges & referrals', true, true],
  ['Marketplace & badges', true, true],
  ['Premium badge on your profile', false, true],
];

function Cell({ v }) {
  if (v === true) return <Icon name="Check" size={20} className="c-mint" />;
  if (v === false) return <span className="muted">-</span>;
  return <span>{v}</span>;
}

export default function Premium() {
  const premiumFaq = [...FAQ.find(f => f.cat === 'Premium').items, FAQ[0].items[1]];
  return (
    <>
      <PageHero eyebrow={<><Icon name="Crown" size={14} /> {PREMIUM.title}</>} title={<>Double the FIT. <span className="grad-gold">Every habit.</span></>}>
        <p>{PREMIUM.tagline}. Unlock all six habits, raise your daily cap and wear the Premium badge.</p>
      </PageHero>

      <section className="section pt-0">
        <div className="container pricing">
          <Reveal className="card price-card" variant="left">
            <p className="eyebrow">Free</p>
            <div className="price">
              {PREMIUM.currency}0<small> forever</small>
            </div>
            <p className="muted">Everything you need to start earning.</p>
            <ul className="check-list">
              <li>
                <Icon name="Check" size={18} /> Pick 1 movement + 2 lifestyle habits
              </li>
              <li>
                <Icon name="Check" size={18} /> Up to {CAPS.free} FIT a day from habits
              </li>
              <li>
                <Icon name="Check" size={18} /> Streaks, challenges, referrals & badges
              </li>
              <li>
                <Icon name="Check" size={18} /> Full marketplace access
              </li>
            </ul>
            <DownloadButton />
          </Reveal>
          <Reveal className="card price-card hot" variant="right" delay={0.08}>
            <span className="ribbon">Most rewarding</span>
            <p className="eyebrow gold">Premium</p>
            <div className="price">
              {PREMIUM.currency}
              {PREMIUM.price}
              <small> / {PREMIUM.durationDays} days</small>
            </div>
            <p className="muted">For people who want every healthy habit to count.</p>
            <ul className="check-list">
              {PREMIUM.benefits.map(b => (
                <li key={b}>
                  <Icon name="Check" size={18} /> {b}
                </li>
              ))}
            </ul>
            <p className="muted small">Bought inside the app. The current price is always shown before you pay.</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <Reveal className="section-head center">
            <p className="eyebrow">Compare</p>
            <h2 className="h2">Free vs Premium</h2>
          </Reveal>
          <Reveal className="table-wrap">
            <table className="table compare">
              <thead>
                <tr>
                  <th />
                  <th>Free</th>
                  <th className="gold">Premium</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, f, p]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>
                      <Cell v={f} />
                    </td>
                    <td>
                      <Cell v={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <Reveal className="section-head center">
            <p className="eyebrow">2x on every habit</p>
            <h2 className="h2">What a Premium day can look like</h2>
          </Reveal>
          <div className="habit-grid">
            {HABITS.map((h, i) => (
              <Reveal key={h.id} className="card double" delay={(i % 3) * 0.08}>
                <IconBubble name={h.icon} color={h.color} size={44} />
                <div>
                  <b>{h.name}</b>
                  <small className="muted">Up to {h.max} FIT free</small>
                </div>
                <span className="double-v">
                  up to <b>{h.max * PREMIUM.multiplier}</b>
                </span>
              </Reveal>
            ))}
          </div>
          <p className="center muted small mt-md">Totals are still limited by the {CAPS.premium} FIT Premium daily cap.</p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <Reveal className="section-head center">
            <h2 className="h2">Premium questions</h2>
          </Reveal>
          <Reveal>
            <Accordion items={premiumFaq} firstOpen />
          </Reveal>
        </div>
      </section>

      <CtaBand title="Make every healthy habit count double." />
    </>
  );
}
