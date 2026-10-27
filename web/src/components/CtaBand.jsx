import Reveal from './Reveal.jsx';
import DownloadButton from './DownloadButton.jsx';
import { Link } from 'react-router';
import appIcon from '../assets/app-icon.png';

/** Closing "get the app" band shown at the bottom of most pages. */
export default function CtaBand({ title = 'Your next walk could pay for your coffee.', text }) {
  return (
    <section className="section">
      <div className="container">
        <Reveal variant="zoom" className="cta-band">
          <div className="cta-glow" aria-hidden="true" />
          <img src={appIcon} alt="" className="cta-icon" />
          <h2>{title}</h2>
          <p>{text || 'Download axyio, pick your habits and start earning FIT today. It’s free.'}</p>
          <div className="cta-actions">
            <DownloadButton />
            <Link to="/features" className="btn btn-ghost">
              Explore features
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
