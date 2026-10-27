import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import PhoneMockup, { StepRing } from '../components/PhoneMockup.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { HABITS } from '../site.js';

const ROWS = [
  {
    eyebrow: 'Automatic step tracking',
    title: 'Every step counts, even when the app is closed',
    text: 'axyio reads your phone’s built-in step sensor and keeps counting in the background. A small live notification shows today’s steps, calories and how far you are from your goal.',
    points: [
      'Uses the hardware step counter, with no wearable needed',
      'Keeps counting after restarts and when the app is closed',
      'Missed a day? The app syncs up to 7 days of step history',
      'Set your own daily step goal between 1,000 and 50,000',
    ],
    visual: 'ring',
  },
  {
    eyebrow: 'Habit logging',
    title: 'Water, sleep, reading, breathing and cycling in a tap',
    text: 'Log a glass of water, record last night’s sleep, or start a timed session for reading, breathing or a bike ride. Sessions are timed on our servers, so the minutes you log are the minutes you did.',
    points: [
      'One-tap water logging with a daily glass goal',
      'Sleep logged once a day, and the latest entry counts',
      'Guided breathing and focused reading timers',
      'Timed rides with distance, checked for realistic speed',
    ],
    visual: 'habits',
  },
  {
    eyebrow: 'Wallet',
    title: 'A wallet that shows every FIT in and out',
    text: 'Your balance is calculated from a full transaction history: habit rewards, streak bonuses, challenge prizes, referrals and redemptions. Tap any entry to see its details.',
    points: ['Full transaction history with filters', 'Level and XP progress on your wallet card', 'Daily cap tracker so you know what’s left today'],
    visual: 'wallet',
  },
  {
    eyebrow: 'Challenges & leaderboards',
    title: 'Friendly competition, real prizes',
    text: 'Join daily and weekly challenges that track your real activity, and see where you rank on weekly, monthly and all-time leaderboards.',
    points: ['Daily and weekly challenges (weeks run Monday to Sunday)', 'Prizes paid automatically when you hit the target', 'See your percentile and the top participants'],
    visual: 'challenges',
  },
  {
    eyebrow: 'Marketplace',
    title: 'Redeem for vouchers, passes and good causes',
    text: 'Browse rewards by category or search for what you want. Redeem in a tap and your voucher code is ready in your redemptions.',
    points: ['Vouchers, Fitness, Food, Lifestyle and Charity', 'Your balance can’t be spent twice, even on two phones at once', 'Stock and price shown before you redeem'],
    visual: 'market',
  },
];

const EXTRAS = [
  { icon: 'Medal', color: 'gold', t: 'Badges', d: 'Eight achievements, from First Steps to Champion, each with a progress bar.' },
  { icon: 'Bell', color: 'primary', t: 'Smart notifications', d: 'Know when you’ve earned FIT, unlocked a badge or finished a challenge.' },
  { icon: 'UserPlus', color: 'mint', t: 'Referrals', d: 'Invite friends with your personal code and earn together.' },
  { icon: 'Crown', color: 'orange', t: 'Premium', d: 'Unlock every habit, earn double FIT and raise your daily cap.' },
  { icon: 'Lock', color: 'cyan', t: 'Secure sign-in', d: 'Email and password, or continue with Google.' },
  { icon: 'Smartphone', color: 'pink', t: 'Built for phones', d: 'Smooth animations, a modern dark design and light on battery.' },
];

function Visual({ kind }) {
  if (kind === 'ring')
    return (
      <div className="feature-visual ring-visual">
        <StepRing size={240} value={0.82} label="8,214" sub="of 10,000 steps" />
        <div className="notif-mock">
          <IconBubble name="Footprints" color="primary" size={34} />
          <div>
            <b>8,214 steps · 312 kcal</b>
            <small>1,786 steps to your goal</small>
            <div className="bar">
              <i className="fill-primary grow" style={{ '--w': '82%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  if (kind === 'habits')
    return (
      <div className="feature-visual habit-stack">
        {HABITS.slice(1).map((h, i) => (
          <div key={h.id} className="habit-line" style={{ '--i': i }}>
            <IconBubble name={h.icon} color={h.color} size={40} />
            <div>
              <b>{h.name}</b>
              <small>{h.verified}</small>
            </div>
            <span className={`rate c-${h.color}`}>{h.rate}</span>
          </div>
        ))}
      </div>
    );
  return (
    <div className="feature-visual">
      <PhoneMockup screen={kind} />
    </div>
  );
}

export default function Features() {
  return (
    <>
      <PageHero eyebrow="Features" title={<>Everything you need to build habits that stick</>}>
        <p>Automatic step tracking, simple habit logging, challenges, a transparent wallet and a marketplace full of rewards, all in one app.</p>
      </PageHero>

      {ROWS.map((r, i) => (
        <section key={r.title} className="section feature-row-wrap">
          <div className={`container feature-row${i % 2 ? ' flip' : ''}`}>
            <Reveal variant={i % 2 ? 'right' : 'left'} className="feature-copy">
              <p className="eyebrow">{r.eyebrow}</p>
              <h2 className="h2">{r.title}</h2>
              <p className="lead">{r.text}</p>
              <ul className="check-list">
                {r.points.map(p => (
                  <li key={p}>
                    <Icon name="Check" size={18} /> {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal variant="zoom" delay={0.1}>
              <Visual kind={r.visual} />
            </Reveal>
          </div>
        </section>
      ))}

      <section className="section section-alt">
        <div className="container">
          <Reveal className="section-head center">
            <p className="eyebrow">And more</p>
            <h2 className="h2">The details that make it feel great</h2>
          </Reveal>
          <div className="trust-grid three">
            {EXTRAS.map((e, i) => (
              <Reveal key={e.t} className="card trust" delay={(i % 3) * 0.08}>
                <IconBubble name={e.icon} color={e.color} size={46} />
                <h3>{e.t}</h3>
                <p>{e.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
