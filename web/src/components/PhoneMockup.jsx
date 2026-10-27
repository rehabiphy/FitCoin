import Icon from './Icon.jsx';

/** A step ring like the one on the app's home screen. */
export function StepRing({ value = 0.72, size = 168, label = '7,240', sub = 'of 10,000 steps' }) {
  const r = (size - 18) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
        <circle
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          style={{ '--len': c, '--off': c * (1 - value) }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-label">
        <Icon name="Footprints" size={18} />
        <strong>{label}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}

const MINI_HABITS = [
  { icon: 'Droplet', color: 'blue', label: '6/8', name: 'Water' },
  { icon: 'Moon', color: 'primary', label: '7.5h', name: 'Sleep' },
  { icon: 'BookOpen', color: 'gold', label: '18m', name: 'Read' },
  { icon: 'Wind', color: 'pink', label: '5m', name: 'Breathe' },
];

/** Phone frame showing a recreation of the app's home screen. */
export default function PhoneMockup({ screen = 'home' }) {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="ps-status">
          <span>9:41</span>
          <span className="ps-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
        {screen === 'home' ? <HomeScreen /> : null}
        {screen === 'wallet' ? <WalletScreen /> : null}
        {screen === 'challenges' ? <ChallengeScreen /> : null}
        {screen === 'market' ? <MarketScreen /> : null}
        <div className="ps-tabs">
          {['Zap', 'Target', 'Trophy', 'Wallet', 'Users'].map((n, i) => (
            <span key={n} className={i === 0 ? 'on' : ''}>
              <Icon name={n} size={16} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeScreen() {
  return (
    <div className="ps-body">
      <div className="ps-hello">
        <div>
          <small>Good morning</small>
          <strong>Aarav 👋</strong>
        </div>
        <span className="ps-streak">
          <Icon name="Flame" size={14} /> 12
        </span>
      </div>
      <div className="ps-ring">
        <StepRing size={150} />
      </div>
      <div className="ps-balance">
        <div>
          <small>FIT balance</small>
          <strong>1,284</strong>
        </div>
        <span className="ps-chip">+42 today</span>
      </div>
      <div className="ps-habits">
        {MINI_HABITS.map(h => (
          <div key={h.name} className="ps-habit">
            <span className={`bubble tint-${h.color}`} style={{ width: 30, height: 30 }}>
              <Icon name={h.icon} size={14} />
            </span>
            <b>{h.label}</b>
            <small>{h.name}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletScreen() {
  const rows = [
    ['Walking · 7,000 steps', '+42', 'Footprints', 'mint'],
    ['7-day streak bonus', '+50', 'Flame', 'orange'],
    ['Hydration Hero', '+40', 'Droplet', 'blue'],
    ['Free tall coffee', '-224', 'Coffee', 'pink'],
  ];
  return (
    <div className="ps-body">
      <div className="ps-wallet-card">
        <small>Total balance</small>
        <strong>1,284 FIT</strong>
        <span>Level 6 · 1,940 XP</span>
      </div>
      <p className="ps-title">Recent activity</p>
      {rows.map(([t, v, i, c]) => (
        <div key={t} className="ps-row">
          <span className={`bubble tint-${c}`} style={{ width: 28, height: 28 }}>
            <Icon name={i} size={13} />
          </span>
          <span className="ps-row-t">{t}</span>
          <b className={v.startsWith('-') ? 'neg' : 'pos'}>{v}</b>
        </div>
      ))}
    </div>
  );
}

function ChallengeScreen() {
  return (
    <div className="ps-body">
      <p className="ps-title">Your challenges</p>
      {[
        ['10K Steps Sprint', 0.71, '5/7 days', 'mint'],
        ['Hydration Hero', 0.75, '6/8 glasses', 'blue'],
        ['Weekly Ride 50', 0.44, '22/50 km', 'cyan'],
      ].map(([t, p, s, c]) => (
        <div key={t} className="ps-challenge">
          <div className="ps-ch-head">
            <b>{t}</b>
            <small>{s}</small>
          </div>
          <div className="bar">
            <i className={`fill-${c}`} style={{ width: `${p * 100}%` }} />
          </div>
        </div>
      ))}
      <div className="ps-rank">
        <Icon name="Trophy" size={16} />
        <span>
          You’re <b>#4</b> this week
        </span>
      </div>
    </div>
  );
}

function MarketScreen() {
  return (
    <div className="ps-body">
      <p className="ps-title">Marketplace</p>
      <div className="ps-market">
        {[
          ['Gift card', 500, 'ShoppingBag', 'orange'],
          ['Gym pass', 1800, 'Dumbbell', 'pink'],
          ['Coffee', 220, 'Coffee', 'mint'],
          ['Plant trees', 300, 'Heart', 'primary'],
        ].map(([t, c, i, col]) => (
          <div key={t} className="ps-item">
            <span className={`bubble tint-${col}`} style={{ width: 34, height: 34 }}>
              <Icon name={i} size={16} />
            </span>
            <b>{t}</b>
            <small>{c} FIT</small>
          </div>
        ))}
      </div>
    </div>
  );
}
