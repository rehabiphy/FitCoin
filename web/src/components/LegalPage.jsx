import { useEffect, useState } from 'react';
import PageHero from './PageHero.jsx';
import { SITE } from '../site.js';

/**
 * Long-form legal layout: sticky table of contents that highlights the
 * section currently on screen. `sections` = [{ id, title, body: ReactNode }].
 */
export default function LegalPage({ eyebrow, title, intro, sections }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map(s => document.getElementById(s.id)).filter(Boolean);
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title}>
        <p>{intro}</p>
        <p className="muted small">Last updated: {SITE.legalUpdated}</p>
      </PageHero>
      <section className="section legal-wrap">
        <div className="container legal">
          <aside className="legal-toc" aria-label="On this page">
            <p className="eyebrow">On this page</p>
            <ol>
              {sections.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={active === s.id ? 'active' : ''}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>
          <article className="legal-body">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="legal-section">
                <h2>
                  <span className="legal-num">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
