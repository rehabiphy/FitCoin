import User from '../models/User.js';
import { STREAK_RULES } from '../config/progression.js';
import { activeDates, creditOnce } from './rewards.service.js';
import { notify } from './notification.service.js';
import { checkReferralReward } from './referral.service.js';
import { refreshUserChallenges } from './challenge.service.js';
import { evaluateBadges } from './badge.service.js';
import { addDays } from '../utils/dates.js';

/** Consecutive active days ending on `date` (0 if `date` itself wasn't active). */
export function streakEndingOn(dateSet, date) {
  let count = 0;
  let d = date;
  while (dateSet.has(d)) {
    count += 1;
    d = addDays(d, -1);
  }
  return count;
}

/**
 * Updates the user's streak after `date` became an active day, and pays the
 * streak bonus on every 7th consecutive day.
 */
async function updateStreak(user, date) {
  const dates = await activeDates(user._id);
  const set = new Set(dates);
  const latest = dates[dates.length - 1];
  const current = latest ? streakEndingOn(set, latest) : 0;

  // Best streak over all history (uploads can fill in earlier days)
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { currentStreak: current, lastActiveDate: latest, bestStreak: Math.max(best, user.bestStreak || 0) } },
  );
  user.currentStreak = current;
  user.lastActiveDate = latest;
  user.bestStreak = Math.max(best, user.bestStreak || 0);

  const streakOnDate = streakEndingOn(set, date);
  if (streakOnDate > 0 && streakOnDate % STREAK_RULES.bonusEvery === 0) {
    const tx = await creditOnce({
      userId: user._id,
      refKey: `streak:${user._id}:${date}`,
      amount: STREAK_RULES.bonusAmount,
      category: 'streak',
      title: `${streakOnDate}-day streak bonus`,
      subtitle: 'Streak reward',
      activityDate: date,
    });
    if (tx) {
      await notify(user._id, {
        type: 'streak',
        title: `${streakOnDate}-day streak!`,
        body: `You've been active ${streakOnDate} days in a row. +${STREAK_RULES.bonusAmount} FIT bonus.`,
        icon: 'Flame',
        color: 'orange',
        dedupeKey: `streak:${user._id}:${date}`,
      });
    }
  }
}

/**
 * Everything that follows a habit reward: streaks, referral payout, challenge
 * progress and badges. Failures are logged, never surfaced — the activity itself was saved.
 */
export async function afterActivity(userId, date) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return;
    }
    await updateStreak(user, date);
    await checkReferralReward(user);
    await refreshUserChallenges(user._id, user.tzOffset || 0);
    await evaluateBadges(user);
  } catch (err) {
    console.error('afterActivity failed:', err);
  }
}
