import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Reveal from '../components/Reveal.jsx';
import Counter from '../components/Counter.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PhoneMockup from '../components/PhoneMockup.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import Accordion from '../components/Accordion.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { BADGES, CAPS, CHALLENGES, FAQ, HABITS, PREMIUM, REFERRAL, REWARD_CATEGORIES, SAMPLE_REWARDS, STREAK } from '../site.js';

function Hero() {
  return (
    <section className="hero">
      <div className="orb orb-a parallax-slow" aria-hidden="true" />
      <div className="orb orb-b parallax-fast" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          <Reveal as="p" className="pill" variant="fade">
            <Icon name="Sparkles" size={14} /> Wellness rewards, made simple
          </Reveal>
          <Reveal as="h1" className="display hero-title" delay={0.08}>
            Move. Earn. <span className="grad-text">Redeem.</span>
          </Reveal>
          <Reveal as="p" className="lead" delay={0.16}>
            axyio pays you for healthy habits. Walk, cycle, drink water, sleep well, read and breathe to earn <b>FIT</b> points, then
            spend them on vouchers, gym passes, food and more.
          </Reveal>
          <Reveal className="hero-actions" delay={0.24}>
            <DownloadButton />
            <Link to="/rewards" className="btn btn-ghost">
              How FIT works <Icon name="ArrowRight" size={18} />
            </Link>
          </Reveal>
          <Reveal className="hero-proof" delay={0.32}>
            <span>
              <Icon name="ShieldCheck" size={16} /> Server-verified rewards
            </span>
            <span>
              <Icon name="Footprints" size={16} /> Steps counted in the background
            </span>
            <span>
              <Icon name="Lock" size={16} /> Free forever plan
            </span>
          </Reveal>
        </div>
        <Reveal variant="zoom" delay={0.15} className="hero-visual">
          <div className="phone-float">
            <PhoneMockup />
          </div>
          <div className="float-chip chip-1">
            <IconBubble name="Footprints" color="mint" size={34} />
            <div>
              <b>+6 FIT</b>
              <small>1,000 steps reached</small>
            </div>
          </div>
          <div className="float-chip chip-2">
            <IconBubble name="Flame" color="orange" size={34} />
            <div>
              <b>Streak bonus</b>
              <small>+50 FIT on day 7</small>
            </div>
          </div>
          <div className="float-chip chip-3">
            <IconBubble name="Medal" color="gold" size={34} />
            <div>
              <b>Badge unlocked</b>
              <small>On Fire</small>
            </div>
          </div>
        </Reveal>
      </div>
      <a href="#stats" className="scroll-cue" aria-label="Scroll down">
        <span />
      </a>
    </section>
  );
}

function Stats() {
  const stats = [
    { n: 6, s: '', label: 'healthy habits that pay' },
    { n: CAPS.free, s: '', label: 'FIT you can earn daily, free' },
    { n: CHALLENGES.length, s: '', label: 'challenges every week' },
    { n: PREMIUM.multiplier, s: 'x', label: 'FIT with Premium' },
  ];
  return (
    <section className="stats" id="stats">
      <div className="container">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <Reveal key={s.label} className="stat" delay={i * 0.08}>
              <strong className="grad-text">
                <Counter to={s.n} suffix={s.s} />
              </strong>
              <span>{s.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: 'Target',
    title: 'Pick your habits',
    text: 'Choose what you want to get better at. Free members pick 1 movement habit and 2 lifestyle habits, and Premium unlocks all six.',
    screen: 'home',
  },
  {
    icon: 'Footprints',
    title: 'Live your day',
    text: 'Steps are counted automatically by your phone’s sensor, even with the app closed. Log water and sleep in a tap, and time reading, breathing and rides in the app.',
    screen: 'challenges',
  },
  {
    icon: 'Coins',
    title: 'Earn FIT, verified',
    text: 'Every reward is checked on our servers before it lands in your wallet. Stack streak bonuses, challenge prizes and referral rewards on top.',
    screen: 'wallet',
  },
  {
    icon: 'Gift',
    title: 'Redeem real rewards',
    text: 'Spend FIT in the marketplace on vouchers, fitness passes, food, lifestyle deals and charity. Your voucher shows up instantly.',
    screen: 'market',
  },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(Number(e.target.dataset.i));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="section how" id="how">
      <div className="container">
        <Reveal className="section-head center">
          <p className="eyebrow">How it works</p>
          <h2 className="h2">Four steps from healthy habit to real reward</h2>
        </Reveal>
        <div className="how-grid">
          <div className="how-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} ref={el => (refs.current[i] = el)} data-i={i} className={`how-step${active === i ? ' active' : ''}`}>
                <span className="how-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>
                    <Icon name={s.icon} size={22} /> {s.title}
                  </h3>
                  <p>{s.text}</p>
                  <div className="how-inline-phone">
                    <PhoneMockup screen={s.screen} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="how-sticky">
            <div className="how-stage">
              {STEPS.map((s, i) => (
                <div key={s.screen} className={`how-screen${active === i ? ' on' : ''}`} aria-hidden={active !== i}>
                  <PhoneMockup screen={s.screen} />
                </div>
              ))}
              <div className="how-dots">
                {STEPS.map((s, i) => (
                  <i key={s.title} className={active === i ? 'on' : ''} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Habits() {
  return (
    <section className="section" id="habits">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Six habits, one wallet</p>
          <h2 className="h2">Get rewarded for the things that make you feel good</h2>
          <p className="lead">Each habit has its own rate and daily maximum. These are the default rates.</p>
        </Reveal>
        <div className="habit-grid">
          {HABITS.map((h, i) => (
            <Reveal key={h.id} className={`card habit-card glow-${h.color}`} delay={(i % 3) * 0.08}>
              <div className="habit-top">
                <IconBubble name={h.icon} color={h.color} size={52} />
                <span className="tag">{h.group}</span>
              </div>
              <h3>{h.name}</h3>
              <p>{h.how}</p>
              <div className="habit-meta">
                <span className={`rate c-${h.color}`}>{h.rate}</span>
                <span className="muted">up to {h.max} FIT/day</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="center mt-lg">
          <Link to="/rewards" className="btn btn-ghost">
            See all reward rules <Icon name="ArrowRight" size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Motivation() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head center">
          <p className="eyebrow">Stay motivated</p>
          <h2 className="h2">Built to keep you coming back, one good day at a time</h2>
        </Reveal>
        <div className="bento">
          <Reveal className="card bento-a" variant="left">
            <IconBubble name="Flame" color="orange" size={48} />
            <h3>Streaks that pay</h3>
            <p>
              Any day you earn FIT keeps your streak alive. Every {STREAK.every}th day in a row adds a <b>+{STREAK.bonus} FIT</b> bonus.
            </p>
            <div className="streak-row">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className={`streak-day${i === 6 ? ' bonus' : ''}`} style={{ '--i': i }}>
                  {i === 6 ? <Icon name="Gift" size={16} /> : <Icon name="Check" size={14} />}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal className="card bento-b" variant="right" delay={0.08}>
            <IconBubble name="TrendingUp" color="cyan" size={48} />
            <h3>Level up</h3>
            <p>Every FIT you earn is XP. Climb levels as your lifetime earnings grow.</p>
            <div className="xp">
              <div className="xp-head">
                <b>Level 6</b>
                <span className="muted">1,940 / 2,100 XP</span>
              </div>
              <div className="bar">
                <i className="fill-primary grow" style={{ '--w': '92%' }} />
              </div>
            </div>
          </Reveal>
          <Reveal className="card bento-c" variant="up" delay={0.1}>
            <IconBubble name="Medal" color="gold" size={48} />
            <h3>{BADGES.length} badges to collect</h3>
            <div className="badge-cloud">
              {BADGES.map((b, i) => (
                <span key={b.name} className={`badge-chip tint-${b.color}`} style={{ '--i': i }}>
                  <Icon name={b.icon} size={14} /> {b.name}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal className="card bento-d" variant="up" delay={0.16}>
            <IconBubble name="Trophy" color="pink" size={48} />
            <h3>Leaderboards</h3>
            <p>See how you rank against everyone this week, this month and of all time.</p>
            <ol className="leader">
              {[
                ['Priya', '4,820'],
                ['Rohan', '4,410'],
                ['You', '3,975'],
              ].map(([n, v], i) => (
                <li key={n} className={n === 'You' ? 'me' : ''}>
                  <span>{i + 1}</span>
                  <b>{n}</b>
                  <em>{v} FIT</em>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Challenges() {
  return (
    <section className="section section-alt">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Challenges</p>
          <h2 className="h2">Daily and weekly goals with bigger prizes</h2>
          <p className="lead">Join a challenge and your progress is tracked from your real activity. The prize lands the moment you hit the target.</p>
        </Reveal>
        <div className="challenge-track">
          {CHALLENGES.map((c, i) => (
            <Reveal key={c.title} className={`card challenge glow-${c.color}`} variant="left" delay={i * 0.07}>
              <div className="challenge-top">
                <IconBubble name={c.icon} color={c.color} size={46} />
                <span className="tag">{c.period}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <div className="prize">
                <Icon name="Coins" size={16} /> {c.reward} FIT prize
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marketplace() {
  const loop = [...SAMPLE_REWARDS, ...SAMPLE_REWARDS];
  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head center">
          <p className="eyebrow">Marketplace</p>
          <h2 className="h2">Spend your FIT on things you’ll actually use</h2>
          <p className="lead">Partner vouchers, passes and offers across five categories.</p>
        </Reveal>
        <div className="cat-row">
          {REWARD_CATEGORIES.map((c, i) => (
            <Reveal key={c.name} className="cat" variant="zoom" delay={i * 0.06}>
              <IconBubble name={c.icon} color={c.color} size={50} />
              <b>{c.name}</b>
              <small>{c.examples}</small>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="marquee" aria-label="Example rewards">
        <div className="marquee-track">
          {loop.map((r, i) => (
            <div key={i} className="reward-pill" aria-hidden={i >= SAMPLE_REWARDS.length}>
              <IconBubble name={r.icon} color={r.color} size={36} />
              <span>{r.title}</span>
              <b>{r.cost} FIT</b>
            </div>
          ))}
        </div>
      </div>
      <p className="container center muted small mt-md">Example rewards. Available rewards and prices change over time and are shown in the app.</p>
    </section>
  );
}

function PremiumTeaser() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="premium-band" variant="zoom">
          <div className="premium-copy">
            <p className="eyebrow gold">
              <Icon name="Crown" size={14} /> {PREMIUM.title}
            </p>
            <h2 className="h2">{PREMIUM.tagline}</h2>
            <ul className="check-list">
              {PREMIUM.benefits.map(b => (
                <li key={b}>
                  <Icon name="Check" size={18} /> {b}
                </li>
              ))}
            </ul>
            <Link to="/premium" className="btn btn-gold">
              See Premium <Icon name="ArrowRight" size={18} />
            </Link>
          </div>
          <div className="premium-compare">
            <div className="pc-col">
              <small>Free</small>
              <strong>{CAPS.free}</strong>
              <span>FIT / day cap</span>
              <div className="pc-bar">
                <i style={{ '--h': '50%' }} />
              </div>
            </div>
            <div className="pc-col hot">
              <small>Premium</small>
              <strong>{CAPS.premium}</strong>
              <span>FIT / day cap</span>
              <div className="pc-bar">
                <i style={{ '--h': '100%' }} />
              </div>
            </div>
            <div className="pc-price">
              {PREMIUM.currency}
              {PREMIUM.price}
              <small> / {PREMIUM.durationDays} days</small>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Referral() {
  return (
    <section className="section">
      <div className="container split">
        <Reveal variant="left">
          <p className="eyebrow">Invite friends</p>
          <h2 className="h2">Better together, and you both get rewarded</h2>
          <p className="lead">
            Share your referral code. When your friend has been active on {REFERRAL.activeDays} days, they get{' '}
            <b>{REFERRAL.friendReward} FIT</b> and you get <b>{REFERRAL.inviterReward} FIT</b>.
          </p>
          <p className="muted small">Up to {REFERRAL.monthlyCap} rewarded referrals per month.</p>
        </Reveal>
        <Reveal variant="right" className="ref-visual">
          <div className="ref-card">
            <small>Your code</small>
            <strong>FIT-AARAV42</strong>
            <span className="btn btn-sm btn-primary">
              <Icon name="Send" size={16} /> Share invite
            </span>
          </div>
          <div className="ref-flow">
            <div>
              <IconBubble name="UserPlus" color="mint" size={40} />
              <small>Friend joins</small>
            </div>
            <i />
            <div>
              <IconBubble name="Footprints" color="cyan" size={40} />
              <small>{REFERRAL.activeDays} active days</small>
            </div>
            <i />
            <div>
              <IconBubble name="Gift" color="gold" size={40} />
              <small>You both earn</small>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { icon: 'ShieldCheck', color: 'mint', t: 'Verified on our servers', d: 'Steps, sessions and logs are checked against sensible limits before any FIT is paid.' },
    { icon: 'Lock', color: 'primary', t: 'Your account is locked down', d: 'Hashed passwords, rotating sessions and Google sign-in with verified emails only.' },
    { icon: 'Layers', color: 'cyan', t: 'An honest ledger', d: 'Your balance is always calculated from your transaction history. You can see every FIT in and out.' },
    { icon: 'Heart', color: 'pink', t: 'Fair for everyone', d: 'Streaks, challenges and referrals pay the same for free and Premium members.' },
  ];
  return (
    <section className="section section-alt">
      <div className="container">
        <Reveal className="section-head center">
          <p className="eyebrow">Fair play & privacy</p>
          <h2 className="h2">Rewards you can trust</h2>
        </Reveal>
        <div className="trust-grid">
          {items.map((it, i) => (
            <Reveal key={it.t} className="card trust" delay={i * 0.08}>
              <IconBubble name={it.icon} color={it.color} size={46} />
              <h3>{it.t}</h3>
              <p>{it.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqPreview() {
  const items = [FAQ[0].items[0], FAQ[2].items[0], FAQ[1].items[0], FAQ[0].items[1], FAQ[2].items[2]];
  return (
    <section className="section">
      <div className="container split faq-split">
        <Reveal variant="left">
          <p className="eyebrow">FAQ</p>
          <h2 className="h2">Questions? We’ve got answers.</h2>
          <p className="lead">Everything else lives in our help center.</p>
          <Link to="/support" className="btn btn-ghost">
            Visit the help center <Icon name="ArrowRight" size={18} />
          </Link>
        </Reveal>
        <Reveal variant="right">
          <Accordion items={items} firstOpen />
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <Habits />
      <Motivation />
      <Challenges />
      <Marketplace />
      <PremiumTeaser />
      <Referral />
      <Trust />
      <FaqPreview />
      <CtaBand />
    </>
  );
}
