import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { BADGES, CAPS, CHALLENGES, FREE_PICKS, HABITS, PREMIUM, REFERRAL, STREAK, levelXp } from '../site.js';

const LEVELS = [2, 3, 5, 10, 15, 20];

function Block({ id, icon, color, title, children }) {
  return (
    <Reveal as="section" id={id} className="card rule-block">
      <div className="rule-head">
        <IconBubble name={icon} color={color} size={46} />
        <h2 className="h3">{title}</h2>
      </div>
      {children}
    </Reveal>
  );
}

export default function Rewards() {
  return (
    <>
      <PageHero eyebrow="FIT & rewards" title={<>How you earn and spend <span className="grad-text">FIT</span></>}>
        <p>
          FIT are in-app reward points you earn for healthy habits and spend in the marketplace. Here is exactly how they work, with no
          small print.
        </p>
      </PageHero>

      <section className="section pt-0">
        <div className="container rules">
          <Block id="earning" icon="Coins" color="gold" title="Earning FIT from habits">
            <p>FIT is credited only after an activity is verified on our servers. Each habit has its own rate and daily maximum:</p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Habit</th>
                    <th>How it’s logged</th>
                    <th>Default reward</th>
                    <th>Daily max</th>
                  </tr>
                </thead>
                <tbody>
                  {HABITS.map(h => (
                    <tr key={h.id}>
                      <td>
                        <span className="td-habit">
                          <IconBubble name={h.icon} color={h.color} size={30} /> {h.name}
                        </span>
                      </td>
                      <td>{h.verified}</td>
                      <td>{h.rate}</td>
                      <td>{h.max} FIT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small">Rates are the defaults and may be adjusted over time. The current rate is always shown in the app.</p>
          </Block>

          <Block id="limits" icon="Target" color="cyan" title="Daily caps & habit picks">
            <ul className="dot-list">
              <li>
                Habit rewards are capped at <b>{CAPS.free} FIT a day</b> for free members and <b>{CAPS.premium} FIT a day</b> for Premium
                members.
              </li>
              <li>
                Free members earn from {FREE_PICKS.movement} movement habit (walking or cycling) and {FREE_PICKS.lifestyle} lifestyle habits
                (water, sleep, reading or breathing). Walking, water and sleep are selected until you choose your own.
              </li>
              <li>Premium members earn from all six habits at once.</li>
              <li>Streak bonuses, challenge prizes and referral rewards are paid on top of the daily cap.</li>
            </ul>
          </Block>

          <Block id="streaks" icon="Flame" color="orange" title="Streaks & levels">
            <ul className="dot-list">
              <li>A day counts towards your streak if any habit earned you FIT that day.</li>
              <li>
                Every {STREAK.every}th day in a row earns a <b>+{STREAK.bonus} FIT</b> streak bonus.
              </li>
              <li>XP equals the lifetime FIT you’ve earned. Levels get a little further apart as you climb.</li>
            </ul>
            <div className="level-row">
              {LEVELS.map((l, i) => (
                <Reveal key={l} className="level" variant="zoom" delay={i * 0.05}>
                  <small>Level</small>
                  <strong>{l}</strong>
                  <span>{levelXp(l).toLocaleString('en-IN')} XP</span>
                </Reveal>
              ))}
            </div>
          </Block>

          <Block id="challenges" icon="Trophy" color="pink" title="Challenges">
            <p>Challenges run daily or weekly (Monday to Sunday, in your local time). Join to take part. Progress comes from your real activity and the prize is paid once, as soon as you reach the target.</p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Challenge</th>
                    <th>Goal</th>
                    <th>Runs</th>
                    <th>Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {CHALLENGES.map(c => (
                    <tr key={c.title}>
                      <td>
                        <span className="td-habit">
                          <IconBubble name={c.icon} color={c.color} size={30} /> {c.title}
                        </span>
                      </td>
                      <td>{c.desc}</td>
                      <td>{c.period}</td>
                      <td>{c.reward} FIT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>

          <Block id="badges" icon="Medal" color="gold" title="Badges">
            <div className="badge-grid">
              {BADGES.map((b, i) => (
                <Reveal key={b.name} className="badge-tile" variant="zoom" delay={(i % 4) * 0.05}>
                  <IconBubble name={b.icon} color={b.color} size={44} />
                  <b>{b.name}</b>
                  <small>{b.desc}</small>
                </Reveal>
              ))}
            </div>
          </Block>

          <Block id="referrals" icon="UserPlus" color="mint" title="Referrals">
            <ul className="dot-list">
              <li>Share your personal code. Your friend enters it when they sign up.</li>
              <li>
                Once your friend has been active on {REFERRAL.activeDays} days, they receive <b>{REFERRAL.friendReward} FIT</b> and you
                receive <b>{REFERRAL.inviterReward} FIT</b>.
              </li>
              <li>You can earn from up to {REFERRAL.monthlyCap} rewarded referrals each month.</li>
            </ul>
          </Block>

          <Block id="premium" icon="Crown" color="orange" title="Premium earning">
            <ul className="dot-list">
              <li>
                Premium members earn <b>{PREMIUM.multiplier}x FIT</b> on every habit and have a {CAPS.premium} FIT daily cap.
              </li>
              <li>Streak bonuses, challenges and referrals pay the same for everyone.</li>
            </ul>
          </Block>

          <Block id="redeeming" icon="Gift" color="mint" title="Redeeming & expiry">
            <ul className="dot-list">
              <li>Redeem FIT for partner vouchers, passes and offers in the marketplace.</li>
              <li>A 2% platform fee is added to marketplace redemptions.</li>
              <li>FIT expire 6 months after they’re earned. We notify you 14 days before, and your oldest FIT are always spent first.</li>
              <li>Some rewards have limited stock. Availability is shown before you redeem.</li>
            </ul>
          </Block>

          <Block id="fair-play" icon="ShieldCheck" color="primary" title="Fair play">
            <ul className="dot-list">
              <li>One account per person and device.</li>
              <li>
                Uploads that look impossible are rejected. That includes more than 100,000 steps a day, steps rising faster than 250 a
                minute, rides averaging over 45 km/h, or water logged less than 10 minutes apart.
              </li>
              <li>Manipulated sensor data, automation or fake referrals lead to lost FIT and account suspension.</li>
              <li>Unusual activity may be held for review before it’s credited. All reward events are kept in an audit log.</li>
            </ul>
          </Block>

          <Reveal className="note-card">
            <Icon name="Lock" size={20} />
            <p>
              <b>FIT is not money.</b> FIT has no cash value, is not a cryptocurrency or security, and cannot be bought, sold, transferred
              between users or withdrawn. Blockchain tokens, transfers, deposits, withdrawals and trading are not part of axyio and would only
              ever be introduced after technical, security and regulatory review.
            </p>
          </Reveal>
        </div>
      </section>
      <CtaBand title="Start earning your first FIT today." />
    </>
  );
}
