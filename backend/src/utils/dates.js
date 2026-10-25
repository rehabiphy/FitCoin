/**
 * The app sends `tzOffset`: minutes east of UTC on the phone (IST = 330),
 * so the server can work out the user's local date without trusting their clock for anything else.
 */

const pad = n => String(n).padStart(2, '0');

/** Local "now" as a Date whose UTC fields hold the user's wall-clock time. */
export const localNow = (tzOffset = 0) => new Date(Date.now() + tzOffset * 60000);

/** "YYYY-MM-DD" from a Date's UTC fields. */
export const toDateKey = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const todayKey = tzOffset => toDateKey(localNow(tzOffset));

/** Adds whole days to a "YYYY-MM-DD" key. */
export function addDays(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateKey(d);
}

/** Minutes since local midnight for the user. */
export function minutesSinceMidnight(tzOffset) {
  const now = localNow(tzOffset);
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

/** Monday of the week containing `dateKey` (weeks run Mon–Sun). */
export function mondayOf(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(dateKey, -shift);
}

export const monthStartOf = dateKey => `${dateKey.slice(0, 7)}-01`;

/** The real (UTC) instant at which local midnight starting `dateKey` happens for this user. */
export const localMidnightUtc = (dateKey, tzOffset) => new Date(new Date(`${dateKey}T00:00:00Z`).getTime() - tzOffset * 60000);

/** Day difference b - a between two date keys. */
export const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

/** The last `count` local dates ending today, oldest first. */
export function lastDays(tzOffset, count) {
  const today = todayKey(tzOffset);
  return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
}
