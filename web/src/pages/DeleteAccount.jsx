import { Link } from 'react-router';
import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import { SITE } from '../site.js';

const subject = encodeURIComponent('Delete my axyio account');
const body = encodeURIComponent('Please delete my axyio account and personal data.\n\nAccount email: \nName on the account: \n');

export default function DeleteAccount() {
  return (
    <>
      <PageHero eyebrow="Account deletion" title="Delete your axyio account">
        <p>You can ask us to delete your axyio account and the personal data linked to it at any time. Here’s how it works.</p>
      </PageHero>

      <section className="section pt-0">
        <div className="container narrow">
          <Reveal className="card rule-block">
            <div className="rule-head">
              <IconBubble name="Mail" color="primary" size={46} />
              <h2 className="h3">How to request deletion</h2>
            </div>
            <ol className="steps-list">
              <li>
                Email <a href={`mailto:${SITE.privacyEmail}?subject=${subject}&body=${body}`}>{SITE.privacyEmail}</a> from the email address
                registered to your axyio account, with the subject “Delete my axyio account”.
              </li>
              <li>We may ask you to confirm the request so that nobody else can delete your account.</li>
              <li>We delete your account within 30 days and email you when it’s done.</li>
            </ol>
            <a className="btn btn-primary" href={`mailto:${SITE.privacyEmail}?subject=${subject}&body=${body}`}>
              <Icon name="Trash2" size={18} /> Request account deletion
            </a>
          </Reveal>

          <div className="two-col">
            <Reveal className="card rule-block" variant="left">
              <div className="rule-head">
                <IconBubble name="Trash2" color="pink" size={40} />
                <h2 className="h3">What we delete</h2>
              </div>
              <ul className="dot-list">
                <li>Your profile: name, email, phone number and photo</li>
                <li>Your password and Google sign-in link</li>
                <li>Step history and habit logs (water, sleep, reading, breathing, rides)</li>
                <li>Challenge entries, badges, streaks and leaderboard entries</li>
                <li>Notifications and active sessions on every device</li>
                <li>Your FIT balance. Unspent FIT is lost and can’t be restored</li>
              </ul>
            </Reveal>
            <Reveal className="card rule-block" variant="right" delay={0.08}>
              <div className="rule-head">
                <IconBubble name="Hourglass" color="gold" size={40} />
                <h2 className="h3">What we may keep</h2>
              </div>
              <ul className="dot-list">
                <li>Records of Premium purchases and redemptions that we must keep for tax, accounting or legal reasons, for as long as the law requires</li>
                <li>Records needed to prevent fraud or abuse, such as accounts suspended for cheating</li>
                <li>Anonymised totals that can no longer identify you</li>
              </ul>
              <p className="muted small">Backups are overwritten within 90 days of deletion.</p>
            </Reveal>
          </div>

          <Reveal className="note-card">
            <Icon name="Gift" size={20} />
            <p>
              <b>Before you go:</b> spend your FIT in the marketplace, and save any voucher codes you haven’t used. Uninstalling the app does
              not delete your account. If you have Premium, deleting your account ends it without a refund for the remaining days unless the
              law requires one.
            </p>
          </Reveal>
          <p className="center muted small mt-md">
            Want only part of your data deleted, or a copy of it? Read our <Link to="/privacy#rights">Privacy Policy</Link> or{' '}
            <Link to="/contact?topic=Privacy%20request">contact us</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
