import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import logo from '../assets/logo-wordmark.png';
import Icon from './Icon.jsx';
import DownloadButton from './DownloadButton.jsx';

const LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/rewards', label: 'FIT & Rewards' },
  { to: '/premium', label: 'Premium' },
  { to: '/about', label: 'About' },
  { to: '/support', label: 'Help' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    const onKey = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo" aria-label="axyio home">
          <img src={logo} alt="axyio" />
        </Link>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-cta">
          <Link to="/contact" className="nav-link hide-sm">
            Contact
          </Link>
          <DownloadButton small />
        </div>
        <button className="nav-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <Icon name={open ? 'X' : 'Menu'} size={22} />
        </button>
      </div>
      <div className={`nav-sheet${open ? ' open' : ''}`}>
        {[...LINKS, { to: '/contact', label: 'Contact' }].map((l, i) => (
          <NavLink key={l.to} to={l.to} className="sheet-link" style={{ '--i': i }}>
            {l.label}
            <Icon name="ArrowRight" size={18} />
          </NavLink>
        ))}
        <div className="sheet-cta" style={{ '--i': LINKS.length + 1 }}>
          <DownloadButton />
        </div>
      </div>
    </header>
  );
}
