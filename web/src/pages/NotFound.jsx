import { Link } from 'react-router';
import Reveal from '../components/Reveal.jsx';
import Icon from '../components/Icon.jsx';

export default function NotFound() {
  return (
    <section className="page-hero not-found">
      <div className="orb orb-a" aria-hidden="true" />
      <div className="container narrow center">
        <Reveal as="p" className="nf-code grad-text" variant="zoom">
          404
        </Reveal>
        <Reveal as="h1" className="h2" delay={0.08}>
          This path took a wrong turn
        </Reveal>
        <Reveal as="p" className="lead" delay={0.14}>
          The page you’re looking for doesn’t exist. Good news: the walk back still counts.
        </Reveal>
        <Reveal delay={0.2}>
          <Link to="/" className="btn btn-primary">
            <Icon name="Footprints" size={18} /> Back to home
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
