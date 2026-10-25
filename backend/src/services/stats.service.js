import Transaction from '../models/Transaction.js';
import { levelFromXp } from '../config/progression.js';
import { STREAK_RULES } from '../config/progression.js';
import { activeDates } from './rewards.service.js';
import { liveStreak, userRank } from './leaderboard.service.js';
import { addDays, mondayOf, todayKey } from '../utils/dates.js';

/** Profile numbers: level/XP, streak, this week's active days and weekly rank. */
export async function getStats(user, tzOffset) {
  const today = todayKey(tzOffset);
  const monday = mondayOf(today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const [lifetimeRow, dates, weekly] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: user._id, amount: { $gt: 0 }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    activeDates(user._id),
    userRank(user._id, 'weekly', tzOffset),
  ]);
  const lifetime = lifetimeRow[0]?.total || 0;
  const active = new Set(dates);
  const streak = liveStreak(user, tzOffset);
  const daysToBonus = STREAK_RULES.bonusEvery - (streak % STREAK_RULES.bonusEvery);

  return {
    ...levelFromXp(lifetime),
    lifetimeEarned: Math.round(lifetime * 100) / 100,
    streak,
    bestStreak: user.bestStreak || 0,
    activeToday: active.has(today),
    activeDays: dates.length,
    // Mon..Sun of the current week: true if active that day
    week: week.map(date => ({ date, active: active.has(date), isToday: date === today, isFuture: date > today })),
    streakBonus: { every: STREAK_RULES.bonusEvery, amount: STREAK_RULES.bonusAmount, daysToBonus },
    weeklyRank: weekly.rank,
    weeklyPoints: weekly.points,
    pointsToNextRank: weekly.pointsToNext,
  };
}
