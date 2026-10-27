import { Link } from 'react-router';
import logo from '../assets/logo-wordmark.png';
import { SITE } from '../site.js';
import DownloadButton from './DownloadButton.jsx';

const COLS = [
  {
    title: 'Product',
    links: [
      ['/features', 'Features'],
      ['/rewards', 'FIT & Rewards'],
      ['/premium', 'Premium'],
      ['/rewards#challenges', 'Challenges'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['/about', 'About us'],
      ['/contact', 'Contact'],
      ['/contact?topic=Partnership', 'Partner with us'],
    ],
  },
  {
    title: 'Support',
    links: [
      ['/support', 'Help center'],
      ['/support#troubleshooting', 'Step tracking help'],
      ['/delete-account', 'Delete account'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['/privacy', 'Privacy Policy'],
      ['/terms', 'Terms of Service'],
      ['/rewards#fair-play', 'Fair play rules'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={logo} alt="axyio" className="footer-logo" />
            <p>Healthy habits, rewarded. Walk, cycle, hydrate, sleep, read and breathe your way to real rewards.</p>
            <DownloadButton />
          </div>
          <div className="footer-cols">
            {COLS.map(c => (
              <div key={c.title}>
                <h4>{c.title}</h4>
                <ul>
                  {c.links.map(([to, label]) => (
                    <li key={to}>
                      <Link to={to}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="footer-note">
          FIT are in-app reward points. They have no cash value, are not a cryptocurrency and cannot be bought, sold, transferred or
          withdrawn. axyio is a wellness app and does not give medical advice. Talk to a doctor before starting a new exercise routine.
        </p>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </span>
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </div>
      </div>
    </footer>
  );
}
