import { colors } from '../theme';

/** Theme colour from a name the server sends ("gold", "mint" …). */
export const themeColor = name => colors[name] || colors.primary;

const AVATAR_COLORS = ['#FFC94D', '#22D3EE', '#FF5C9A', '#7C5CFF', '#34F5B4', '#FF8A3D', '#4D8DFF', '#C9D3E8'];

/** Stable colour per person, so the same user always gets the same avatar colour. */
export function avatarColor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) % 1000003;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function timeAgo(date) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) {
    return 'just now';
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}m ago`;
  }
  if (s < 86400) {
    return `${Math.floor(s / 3600)}h ago`;
  }
  const days = Math.floor(s / 86400);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

/** "2d 14h" / "5h 20m" until a date. */
export function timeLeft(date) {
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) {
    return 'Ended';
  }
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) {
    return `${d}d ${String(h).padStart(2, '0')}h`;
  }
  return `${h}h ${String(m % 60).padStart(2, '0')}m`;
}

export const isToday = date => new Date(date).toDateString() === new Date().toDateString();

/** "Today, 8:42 PM" / "Yesterday, 6:18 PM" / "Oct 18, 2026". */
export function friendlyDate(date) {
  const d = new Date(date);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday(d)) {
    return `Today, ${time}`;
  }
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) {
    return `Yesterday, ${time}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const capitalize = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

const CATEGORY_ICONS = {
  steps: 'Footprints',
  streak: 'Flame',
  challenge: 'Trophy',
  referral: 'Users',
  marketplace: 'Gift',
  system: 'Coins',
};
const ACTIVITY_ICONS = { cycle: 'Bike', water: 'Droplet', sleep: 'Moon', read: 'BookOpen', breathe: 'Wind', walk: 'Footprints' };

/** Server transaction -> what TransactionRow / TransactionDetail display. */
export function txView(tx) {
  let icon = CATEGORY_ICONS[tx.category] || 'Coins';
  if (tx.category === 'activity') {
    icon = ACTIVITY_ICONS[tx.activity] || 'Activity';
  }
  if (tx.type === 'fee') {
    icon = 'Info';
  }
  if (tx.type === 'expire') {
    icon = 'Hourglass';
  }
  return { ...tx, icon, date: friendlyDate(tx.createdAt), status: capitalize(tx.status) };
}
