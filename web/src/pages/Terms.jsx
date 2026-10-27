import { Link } from 'react-router';
import LegalPage from '../components/LegalPage.jsx';
import { CAPS, PREMIUM, SITE } from '../site.js';

const mail = <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>;

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Accepting these terms',
    body: (
      <p>
        These Terms of Service (“Terms”) are an agreement between you and {SITE.legalName} (“axyio”, “we”, “us”) for your use of the axyio
        app, website and related services (the “Services”). By creating an account or using the Services you agree to these Terms and to
        our <Link to="/privacy">Privacy Policy</Link>. If you don’t agree, please don’t use the Services.
      </p>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility & accounts',
    body: (
      <ul>
        <li>You must be at least 13 years old. If you are under 18, you need the consent of a parent or guardian.</li>
        <li>You may have only one account, and only on your own device. Accounts are personal and can’t be shared, sold or transferred.</li>
        <li>Keep your details accurate and your password secret. You are responsible for activity on your account.</li>
        <li>Tell us straight away at {mail} if you think someone else has accessed your account.</li>
      </ul>
    ),
  },
  {
    id: 'health',
    title: 'Health disclaimer',
    body: (
      <p>
        axyio encourages healthy habits but is <b>not a medical device and does not give medical advice</b>. Step counts and other figures
        are estimates. Talk to a doctor before starting a new exercise, sleep or breathing routine, especially if you have a health
        condition. Stop any activity that causes pain, dizziness or discomfort. Always cycle and walk safely and follow local traffic laws.
      </p>
    ),
  },
  {
    id: 'fit',
    title: 'FIT reward points',
    body: (
      <>
        <ul>
          <li>
            FIT are promotional reward points that we give you, at our discretion, for qualifying activity. <b>FIT have no cash value</b>,
            are not a currency, cryptocurrency, security or other financial product, and are not your property.
          </li>
          <li>FIT can’t be bought, sold, traded, transferred between accounts, exchanged for cash or withdrawn.</li>
          <li>
            Each activity has a rate and daily maximum, and habit rewards are capped each day (by default {CAPS.free} FIT for free members and{' '}
            {CAPS.premium} FIT for Premium members). Rates, caps, challenges and rewards are shown in the app and may change over time.
          </li>
          <li>FIT expire 6 months after they are earned. We notify you 14 days before, and your oldest FIT are spent first.</li>
          <li>
            We may hold, correct or remove FIT that were credited by mistake, through a technical error, or through activity that breaks these
            Terms.
          </li>
          <li>Unspent FIT are lost when your account is closed.</li>
        </ul>
        <p>
          The current earning rules are explained on our <Link to="/rewards">FIT & rewards</Link> page.
        </p>
      </>
    ),
  },
  {
    id: 'marketplace',
    title: 'Marketplace & redemptions',
    body: (
      <ul>
        <li>You can redeem FIT for rewards in the marketplace while they are available. Stock is limited for some rewards.</li>
        <li>A 2% platform fee, in FIT, is added to each redemption.</li>
        <li>Rewards are provided by third-party partners and are subject to their own terms, validity dates and conditions.</li>
        <li>Redemptions are final once the voucher is issued, unless the reward can’t be fulfilled, in which case we return your FIT.</li>
        <li>We are not responsible for a partner’s products or services, but we will help if there is a problem with a voucher you redeemed.</li>
      </ul>
    ),
  },
  {
    id: 'premium',
    title: 'Premium membership',
    body: (
      <ul>
        <li>
          {PREMIUM.title} gives you extra benefits, such as earning from all habits, {PREMIUM.multiplier}x FIT on habit rewards and a higher daily
          cap, for the period you buy (currently {PREMIUM.durationDays} days for {PREMIUM.currency}
          {PREMIUM.price}).
        </li>
        <li>Prices and benefits are shown in the app before you pay and may change. Changes won’t affect a period you’ve already paid for.</li>
        <li>Payments are processed by Google Play under its terms. Refunds follow Google Play’s refund policy and applicable law.</li>
        <li>Premium ends when your paid period is over unless you buy again. Buying again extends your current period.</li>
        <li>Premium doesn’t change streak bonuses, challenge prizes or referral rewards.</li>
      </ul>
    ),
  },
  {
    id: 'referrals',
    title: 'Referrals',
    body: (
      <p>
        You can invite friends with your personal referral code. Referral rewards are paid once your friend has been active on the required
        number of days, up to a monthly limit. Referring yourself, creating fake accounts or paying people to sign up is not allowed, and any
        rewards from it will be removed.
      </p>
    ),
  },
  {
    id: 'fair-play',
    title: 'Fair play & acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>fake, manipulate or automate step counts or activity, for example with shaking devices, emulators, modified apps or scripts;</li>
          <li>create multiple accounts or use someone else’s account;</li>
          <li>exploit bugs or errors to earn FIT, and you agree to report any you find;</li>
          <li>reverse engineer, scrape, overload or interfere with the Services or their security;</li>
          <li>upload offensive, unlawful or misleading content, such as in your name or profile photo; or</li>
          <li>use the Services for any unlawful purpose.</li>
        </ul>
        <p>
          We may reject impossible data, hold unusual activity for review, remove FIT and suspend or close accounts that break these rules.
        </p>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'Our content',
    body: (
      <p>
        The Services, including the axyio name, logo, design, software and content, belong to {SITE.legalName} or its licensors. We give you a
        personal, non-exclusive, non-transferable licence to use the app for its intended purpose while you follow these Terms.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Changes & availability',
    body: (
      <p>
        We are always improving axyio. We may add, change or remove features, rewards, challenges or earning rules, or pause the Services for
        maintenance. We will give reasonable notice of significant changes where we can. We may also end the FIT programme. If we do, we will
        give you at least 30 days’ notice to redeem your FIT.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Ending your account',
    body: (
      <p>
        You can stop using axyio and <Link to="/delete-account">delete your account</Link> at any time. We may suspend or close your account
        if you break these Terms, if required by law, or to protect other members. When an account is closed, its FIT and any unused
        benefits end.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Disclaimers & liability',
    body: (
      <>
        <p>
          The Services are provided “as is” and “as available”. We do our best to keep them accurate and running, but we don’t promise they will
          always be error-free or uninterrupted, or that step counts will match other devices.
        </p>
        <p>
          To the extent allowed by law, we are not liable for indirect or consequential losses, or for injuries arising from physical activity
          you choose to do. Our total liability to you for any claim is limited to the amount you paid us for Premium in the 3 months before the
          claim. Nothing in these Terms limits rights you have under consumer protection law that can’t be excluded.
        </p>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    body: (
      <p>
        These Terms are governed by the laws of {SITE.jurisdiction}. Before going to court, please contact us so we can try to resolve the
        issue informally. Any dispute that can’t be resolved will be handled by the competent courts of {SITE.jurisdiction}.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these Terms. If the changes are significant, we will tell you in the app or by email before they take effect. If you keep
        using the Services after that, you accept the new Terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: <p>Questions about these Terms? Email {mail} or use our <Link to="/contact">contact form</Link>.</p>,
  },
];

export default function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The rules for using axyio, written to be as clear as possible."
      sections={SECTIONS}
    />
  );
}
