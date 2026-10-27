import { Link } from 'react-router';
import LegalPage from '../components/LegalPage.jsx';
import { SITE } from '../site.js';

const mail = <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a>;

const SECTIONS = [
  {
    id: 'who',
    title: 'Who we are',
    body: (
      <>
        <p>
          axyio (“axyio”, “we”, “us”) is a wellness rewards app operated by {SITE.legalName}. This policy explains what personal data we
          collect when you use the axyio mobile app, this website and our related services (together, the “Services”), why we collect it,
          and the choices you have.
        </p>
        <p>
          We act as the data fiduciary (data controller) for your personal data. If you have any questions, contact us at {mail}.
        </p>
      </>
    ),
  },
  {
    id: 'collect',
    title: 'Data we collect',
    body: (
      <>
        <h3>Data you give us</h3>
        <ul>
          <li>
            <b>Account details:</b> your name, email address and password, or your Google account’s name, email address and profile ID if
            you continue with Google. Your password is stored only as a secure bcrypt hash.
          </li>
          <li>
            <b>Optional profile details:</b> phone number and profile photo, if you add them.
          </li>
          <li>
            <b>Referral code:</b> the code of the friend who invited you, if you enter one.
          </li>
          <li>
            <b>Habit logs:</b> glasses of water, hours of sleep, reading and breathing sessions, cycling rides and the distance you enter.
          </li>
          <li>
            <b>Your choices:</b> your step goal, the habits you choose to earn from, the challenges you join and the rewards you redeem.
          </li>
          <li>
            <b>Messages:</b> anything you send us by email or through our contact form.
          </li>
        </ul>
        <h3>Data collected automatically</h3>
        <ul>
          <li>
            <b>Step counts:</b> with your permission (“Physical activity” on Android), the app reads your phone’s step sensor and uploads
            one total per day. We do not collect your location or GPS route.
          </li>
          <li>
            <b>Time zone offset:</b> so that “today” means your local day for rewards, streaks and challenges.
          </li>
          <li>
            <b>Activity and reward records:</b> FIT earned and spent, streaks, levels, badges, leaderboard positions, Premium status and
            dates, and redemptions.
          </li>
          <li>
            <b>Session and security data:</b> sign-in times, session tokens (stored as hashes on our servers) and basic request information
            such as IP address, used for security, rate limiting and preventing abuse.
          </li>
        </ul>
        <h3>What we don’t collect</h3>
        <p>
          We don’t use advertising SDKs, we don’t track you across other apps or websites, and we don’t collect your contacts, photos,
          microphone, camera or precise location.
        </p>
      </>
    ),
  },
  {
    id: 'permissions',
    title: 'App permissions',
    body: (
      <ul>
        <li>
          <b>Physical activity:</b> to count your steps with the phone’s built-in step sensor.
        </li>
        <li>
          <b>Notifications:</b> to show the ongoing step-tracking notification with today’s progress.
        </li>
        <li>
          <b>Run in the background, start at boot, exact alarms and battery optimisation exemption:</b> so step counting keeps working
          when the app is closed or the phone restarts, and today’s count rolls over at midnight.
        </li>
        <li>
          <b>Internet:</b> to sync your activity and rewards with our servers.
        </li>
      </ul>
    ),
  },
  {
    id: 'use',
    title: 'How we use your data',
    body: (
      <>
        <ul>
          <li>To create and secure your account and keep you signed in.</li>
          <li>To count your activity, calculate and credit FIT, and run streaks, levels, badges, challenges and leaderboards.</li>
          <li>To process marketplace redemptions and Premium memberships.</li>
          <li>To pay referral rewards to you and the friend who invited you.</li>
          <li>To detect and prevent cheating, fraud and abuse, including rejecting impossible step or activity data.</li>
          <li>To send you in-app notifications about rewards, badges, challenges and your account.</li>
          <li>To answer your support requests and improve the Services.</li>
          <li>To comply with the law and enforce our <Link to="/terms">Terms of Service</Link>.</li>
        </ul>
        <p>
          We process your data based on your consent (which you can withdraw at any time), to provide the Services you asked for, and where
          required by law. We never sell your personal data.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    body: (
      <>
        <ul>
          <li>
            <b>Other axyio members:</b> your name, profile photo, level, streak and FIT totals may appear on leaderboards and challenge
            rankings. Friends you invite can see that you referred them.
          </li>
          <li>
            <b>Service providers:</b> cloud hosting and database providers that store and run our Services, and Google, if you choose to
            sign in with Google. They may only use the data to provide their service to us.
          </li>
          <li>
            <b>Payment providers:</b> Google Play handles Premium payments. We receive confirmation of your purchase, not your card details.
          </li>
          <li>
            <b>Reward partners:</b> when you redeem a reward we may share only what’s needed to fulfil it, such as a voucher reference.
          </li>
          <li>
            <b>Legal reasons:</b> if required by law, or to protect the rights, safety and property of our members or of axyio.
          </li>
          <li>
            <b>Business changes:</b> if axyio is merged, acquired or sold, your data may transfer to the new owner under this policy.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    body: (
      <ul>
        <li>All traffic between the app and our servers is encrypted with HTTPS.</li>
        <li>Passwords are hashed with bcrypt. Session tokens on your phone are kept in the Android Keystore or iOS Keychain.</li>
        <li>Short-lived access tokens with rotating refresh tokens. Changing your password signs out every other device.</li>
        <li>Rate limits, input validation and strict access controls on our servers.</li>
      </ul>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <p>
        We keep your data while your account is active. When you delete your account, we delete or anonymise your personal data within 30
        days, except records we must keep for legal, tax, accounting or fraud-prevention reasons, which we keep only as long as needed.
        Backups are overwritten within 90 days. See <Link to="/delete-account">Delete your account</Link>.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>Depending on where you live, including under India’s Digital Personal Data Protection Act, 2023, you have the right to:</p>
        <ul>
          <li>access a summary of the personal data we hold about you;</li>
          <li>correct or update inaccurate data. Most profile details can be edited in the app;</li>
          <li>delete your account and personal data;</li>
          <li>withdraw consent, for example by turning off the physical activity permission (step rewards will stop);</li>
          <li>nominate someone to exercise your rights if you die or become unable to; and</li>
          <li>raise a complaint with us, and then with the relevant data protection authority.</li>
        </ul>
        <p>To use any of these rights, email {mail}. We reply within 30 days.</p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        axyio is not meant for children under 13. If you are under 18, you may use axyio only with the consent and supervision of a parent
        or guardian. If we learn that we’ve collected data from a child without that consent, we will delete it. Parents can contact us at{' '}
        {mail}.
      </p>
    ),
  },
  {
    id: 'transfers',
    title: 'International transfers',
    body: (
      <p>
        Our service providers may store or process data on servers outside your country. Wherever your data is processed, we protect it as
        described in this policy and as required by applicable law.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy from time to time. If we make significant changes, we will tell you in the app or by email before they take
        effect. The date at the top shows when it was last updated.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact & grievances',
    body: (
      <p>
        For privacy questions, requests or complaints, contact our Grievance Officer at {mail}. We acknowledge complaints within 48 hours
        and aim to resolve them within 30 days.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Your health data is personal. Here’s exactly what we collect, why, and how you stay in control."
      sections={SECTIONS}
    />
  );
}
