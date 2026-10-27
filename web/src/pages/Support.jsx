import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import Accordion from '../components/Accordion.jsx';
import { FAQ, SITE } from '../site.js';

const CAT_ICONS = {
  'Getting started': ['Sparkles', 'primary'],
  'Steps & tracking': ['Footprints', 'mint'],
  'FIT & rewards': ['Coins', 'gold'],
  Premium: ['Crown', 'orange'],
  'Account & security': ['ShieldCheck', 'cyan'],
};

const FIXES = [
  { t: 'Allow physical activity', d: 'Settings → Apps → axyio → Permissions → Physical activity → Allow.' },
  { t: 'Allow notifications', d: 'The step tracker runs as a small ongoing notification. If notifications are off, Android may stop it.' },
  { t: 'Turn off battery optimisation', d: 'Settings → Apps → axyio → Battery → Unrestricted. Some brands also have “Auto-launch” or “Sleeping apps” settings to turn off.' },
  { t: 'Open the app to sync', d: 'Steps upload while the app is open. Opening it syncs up to the last 7 days.' },
  { t: 'Check the date and time', d: 'Keep automatic date and time on, so your days line up with your local time.' },
];

export default function Support() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FAQ.filter(g => cat === 'All' || g.cat === cat)
      .map(g => ({
        ...g,
        items: needle ? g.items.filter(it => `${it.q} ${it.a}`.toLowerCase().includes(needle)) : g.items,
      }))
      .filter(g => g.items.length);
  }, [q, cat]);

  return (
    <>
      <PageHero eyebrow="Help center" title="How can we help?">
        <div className="search">
          <Icon name="Search" size={20} />
          <input type="search" placeholder="Search questions, e.g. “steps not counting”" value={q} onChange={e => setQ(e.target.value)} aria-label="Search help articles" />
        </div>
      </PageHero>

      <section className="section pt-0">
        <div className="container">
          <div className="cat-tabs" role="tablist" aria-label="Help topics">
            {['All', ...FAQ.map(f => f.cat)].map(c => (
              <button key={c} role="tab" aria-selected={cat === c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="faq-groups">
            {results.length ? (
              results.map((g, gi) => (
                <Reveal key={g.cat} className="faq-group" delay={gi * 0.05}>
                  <div className="faq-group-head">
                    <IconBubble name={CAT_ICONS[g.cat][0]} color={CAT_ICONS[g.cat][1]} size={40} />
                    <h2 className="h3">{g.cat}</h2>
                  </div>
                  <Accordion key={`${g.cat}-${q}`} items={g.items} firstOpen={Boolean(q)} />
                </Reveal>
              ))
            ) : (
              <div className="empty card">
                <Icon name="Search" size={28} />
                <p>No answers match “{q}”.</p>
                <Link to={`/contact?topic=Support&message=${encodeURIComponent(q)}`} className="btn btn-primary btn-sm">
                  Ask our team
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="troubleshooting">
        <div className="container">
          <Reveal className="section-head">
            <p className="eyebrow">Troubleshooting</p>
            <h2 className="h2">Steps not counting? Try these five fixes</h2>
            <p className="lead">Most step issues come from Android stopping background apps to save battery.</p>
          </Reveal>
          <ol className="fix-list">
            {FIXES.map((f, i) => (
              <Reveal as="li" key={f.t} className="card fix" variant="left" delay={i * 0.06}>
                <span className="fix-n">{i + 1}</span>
                <div>
                  <h3>{f.t}</h3>
                  <p>{f.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container support-cards">
          <Reveal className="card support-card" variant="up">
            <IconBubble name="Mail" color="primary" size={48} />
            <h3>Email support</h3>
            <p>Can’t find your answer? Write to us and we’ll reply within 2 working days.</p>
            <a className="btn btn-ghost btn-sm" href={`mailto:${SITE.supportEmail}`}>
              {SITE.supportEmail}
            </a>
          </Reveal>
          <Reveal className="card support-card" variant="up" delay={0.08}>
            <IconBubble name="LifeBuoy" color="mint" size={48} />
            <h3>Contact form</h3>
            <p>Report a missing reward, a redemption problem or a bug.</p>
            <Link className="btn btn-ghost btn-sm" to="/contact?topic=Support">
              Open the form
            </Link>
          </Reveal>
          <Reveal className="card support-card" variant="up" delay={0.16}>
            <IconBubble name="Trash2" color="pink" size={48} />
            <h3>Delete your account</h3>
            <p>Learn how to delete your account and what happens to your data.</p>
            <Link className="btn btn-ghost btn-sm" to="/delete-account">
              Account deletion
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
