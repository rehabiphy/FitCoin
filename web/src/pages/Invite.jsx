import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import { REFERRAL, SITE } from '../site.js';

/**
 * /invite/:code — what a friend sees when they open an invite link without
 * the app installed (with the app, Android opens the app straight away via
 * the App Link in /.well-known/assetlinks.json).
 *
 * The Play Store link carries the code as the install referrer, so the app
 * can fill it in on the sign-up screen after installing.
 */

const isAndroid = () => /android/i.test(navigator.userAgent);

const playUrl = code =>
  `https://play.google.com/store/apps/details?id=${SITE.packageName}&referrer=${encodeURIComponent(`invite_code=${code}`)}`;

// Opens the app if it is installed, otherwise Android follows the fallback to the Play Store
const appIntent = code =>
  `intent://invite/${encodeURIComponent(code)}#Intent;scheme=axyio;package=${SITE.packageName};` +
  `S.browser_fallback_url=${encodeURIComponent(playUrl(code))};end`;

export default function Invite() {
  const code = (useParams().code || '').trim().toUpperCase();
  const valid = /^[A-Z0-9-]{3,32}$/.test(code);
  const [owner, setOwner] = useState(null); // { name, reward } | 'missing' | null while loading
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!valid) {
      setOwner('missing');
      return;
    }
    let live = true;
    fetch(`${SITE.apiUrl}/referrals/code/${encodeURIComponent(code)}`)
      .then(r => (r.status === 404 ? 'missing' : r.ok ? r.json().then(j => j.data) : null))
      .then(d => live && setOwner(d))
      // Offline or API asleep: still show the code, just without the name
      .catch(() => live && setOwner(null));
    return () => {
      live = false;
    };
  }, [code, valid]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the code is selectable text anyway
    }
  };

  if (owner === 'missing') {
    return (
      <section className="page-hero not-found">
        <div className="orb orb-a" aria-hidden="true" />
        <div className="container narrow center">
          <Reveal as="h1" className="h2">
            This invite link doesn’t work
          </Reveal>
          <Reveal as="p" className="lead" delay={0.08}>
            The code <b>{code || '—'}</b> wasn’t found. Ask your friend to share their link again, or join axyio without a code.
          </Reveal>
          <Reveal delay={0.14}>
            <a className="btn btn-primary" href={`https://play.google.com/store/apps/details?id=${SITE.packageName}`}>
              <Icon name="Smartphone" size={18} /> Get axyio
            </a>
          </Reveal>
        </div>
      </section>
    );
  }

  const reward = owner?.reward ?? REFERRAL.friendReward;
  const who = owner?.name || 'A friend';

  return (
    <section className="page-hero invite">
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />
      <div className="container narrow center">
        <Reveal variant="zoom">
          <IconBubble name="Gift" color="mint" size={72} />
        </Reveal>
        <Reveal as="h1" className="h2 invite-title" delay={0.06}>
          {who} invited you to axyio
        </Reveal>
        <Reveal as="p" className="lead" delay={0.12}>
          Earn axyio for walking, sleeping well, drinking water and more. Join with this code and get <b>{reward} axyio</b> the moment you
          sign up.
        </Reveal>

        <Reveal delay={0.18} className="invite-code-wrap">
          <small>Invite code</small>
          <button type="button" className="invite-code" onClick={copy} aria-label={`Copy invite code ${code}`}>
            <strong>{code}</strong>
            <span>
              <Icon name={copied ? 'Check' : 'Copy'} size={16} /> {copied ? 'Copied' : 'Copy'}
            </span>
          </button>
        </Reveal>

        <Reveal delay={0.24} className="invite-actions">
          {isAndroid() ? (
            <a className="btn btn-primary btn-store" href={appIntent(code)}>
              <Icon name="Smartphone" size={20} />
              <span className="store-text">
                <small>Have the app? Open it, or</small>
                Get axyio on Google Play
              </span>
            </a>
          ) : (
            <a className="btn btn-primary btn-store" href={playUrl(code)}>
              <Icon name="Smartphone" size={20} />
              <span className="store-text">
                <small>Get it on</small>
                Google Play
              </span>
            </a>
          )}
        </Reveal>

        <Reveal as="ol" className="invite-steps" delay={0.3}>
          <li>Install axyio from Google Play.</li>
          <li>
            Create your account. The code <b>{code}</b> is filled in for you (or type it in).
          </li>
          <li>
            You get {reward} axyio and {who === 'A friend' ? 'your friend' : who} gets {REFERRAL.inviterReward} axyio straight away.
          </li>
        </Reveal>
      </div>
    </section>
  );
}
