import { Link } from 'react-router';
import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import CtaBand from '../components/CtaBand.jsx';
import logo from '../assets/logo-wordmark.png';

const VALUES = [
  { icon: 'Heart', color: 'pink', t: 'Wellbeing first', d: 'We reward balance, not extremes. Every habit has a sensible daily limit, so axyio never pushes you to overdo it.' },
  { icon: 'ShieldCheck', color: 'mint', t: 'Honest rewards', d: 'Every FIT is verified and recorded. No hidden rules. Our reward rules are public and the same for everyone.' },
  { icon: 'Lock', color: 'primary', t: 'Privacy by design', d: 'We collect only what we need to run the app and reward you. We never sell your data.' },
  { icon: 'Users', color: 'cyan', t: 'Better together', d: 'Challenges, leaderboards and referrals make healthy living something you share.' },
];

const PILLARS = [
  { icon: 'Footprints', t: 'Movement', d: 'Walking and cycling, the easiest ways to move more every day.' },
  { icon: 'Droplet', t: 'Hydration', d: 'Small, regular glasses that add up to a better day.' },
  { icon: 'Moon', t: 'Rest', d: 'A good night’s sleep is the foundation of everything else.' },
  { icon: 'Wind', t: 'Mind', d: 'Reading and breathing sessions for focus and calm.' },
];

export default function About() {
  return (
    <>
      <PageHero eyebrow="About us" title={<>We make healthy habits <span className="grad-text">worth it</span></>}>
        <p>
          Everyone knows they should walk more, drink more water and sleep better. axyio gives you a reason to do it today, with rewards
          you can actually use.
        </p>
      </PageHero>

      <section className="section pt-0">
        <div className="container split">
          <Reveal variant="left">
            <p className="eyebrow">Our story</p>
            <h2 className="h2">Small wins, every day</h2>
            <p className="lead">
              Motivation fades. Rewards don’t. We built axyio around a simple idea: if every healthy choice gave you something back, you’d make
              more of them.
            </p>
            <p>
              So we turned six everyday habits into FIT points that you can spend on vouchers, fitness passes, food, lifestyle deals and
              charity. We check every reward on our servers so the system stays fair, and we added streaks, challenges, badges and
              leaderboards to keep the momentum going.
            </p>
          </Reveal>
          <Reveal variant="zoom" className="about-logo">
            <div className="about-logo-card">
              <img src={logo} alt="axyio" />
              <p>Move. Earn. Redeem.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <Reveal className="section-head center">
            <p className="eyebrow">What we reward</p>
            <h2 className="h2">Four pillars of a healthier day</h2>
          </Reveal>
          <div className="pillars">
            {PILLARS.map((p, i) => (
              <Reveal key={p.t} className="pillar" delay={i * 0.08}>
                <span className="pillar-icon">
                  <Icon name={p.icon} size={28} />
                </span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="section-head center">
            <p className="eyebrow">Our values</p>
            <h2 className="h2">What we stand for</h2>
          </Reveal>
          <div className="trust-grid">
            {VALUES.map((v, i) => (
              <Reveal key={v.t} className="card trust" delay={i * 0.08}>
                <IconBubble name={v.icon} color={v.color} size={46} />
                <h3>{v.t}</h3>
                <p>{v.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="card partner-card" variant="zoom">
            <div>
              <p className="eyebrow">For brands</p>
              <h2 className="h2">Put your brand in front of people who move</h2>
              <p className="lead">
                Offer vouchers, passes or deals in the axyio marketplace and reach an audience that’s actively building healthier habits.
              </p>
            </div>
            <Link to="/contact?topic=Partnership" className="btn btn-primary">
              <Icon name="Handshake" size={18} /> Partner with us
            </Link>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
