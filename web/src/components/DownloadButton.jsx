import { Link } from 'react-router';
import { SITE } from '../site.js';

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="currentColor" d="M4.2 2.3c-.3.3-.4.7-.4 1.2v17c0 .5.1.9.4 1.2l9.5-9.7-9.5-9.7Zm10.7 8.5 2.7-2.8-11-6.3c-.4-.2-.8-.3-1.1-.2l9.4 9.3Zm0 2.4-9.4 9.3c.3.1.7 0 1.1-.2l11-6.3-2.7-2.8Zm4.1-4.4-3 3.2 3 3.1 2.9-1.7c.9-.5.9-1.4 0-1.9L19 8.8Z" />
    </svg>
  );
}

/** Google Play button; shows "Coming soon" until SITE.playStoreUrl is set. */
export default function DownloadButton({ small = false, className = '' }) {
  const live = Boolean(SITE.playStoreUrl);
  const cls = `btn btn-primary${small ? ' btn-sm' : ' btn-store'} ${className}`;
  const inner = small ? (
    <>
      <PlayGlyph />
      <span>{live ? 'Get the app' : 'Coming soon'}</span>
    </>
  ) : (
    <>
      <PlayGlyph />
      <span className="store-text">
        <small>{live ? 'Get it on' : 'Coming soon to'}</small>
        Google Play
      </span>
    </>
  );
  return live ? (
    <a className={cls} href={SITE.playStoreUrl} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <Link className={cls} to="/contact?topic=Launch%20updates" aria-label="Coming soon to Google Play. Ask to be notified">
      {inner}
    </Link>
  );
}
