import Reveal from './Reveal.jsx';

/** Header block used at the top of every inner page. */
export default function PageHero({ eyebrow, title, children }) {
  return (
    <section className="page-hero">
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />
      <div className="container narrow center">
        {eyebrow ? (
          <Reveal as="p" className="eyebrow" variant="fade">
            {eyebrow}
          </Reveal>
        ) : null}
        <Reveal as="h1" className="display" delay={0.05}>
          {title}
        </Reveal>
        {children ? (
          <Reveal as="div" className="lead" delay={0.15}>
            {children}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
