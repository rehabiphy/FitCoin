import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import ActivitySession from '../models/ActivitySession.js';
import ApiError from '../utils/ApiError.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { HABIT_GROUPS, HABIT_GROUP_IDS, groupOf } from '../config/rewards.js';
import { ACTIVITY_CATEGORIES } from './rewards.service.js';

/**
 * Free members earn from a few habits they pick in each group — by default
 * 1 movement habit (walk or cycle) and 2 lifestyle habits (water, sleep, read,
 * breathe). Limits are set in the admin panel. Premium members earn from all.
 *
 * To stop "earn from my habits, swap, earn from others" on one day:
 *  - a habit that already earned FIT today (or has a running session) can't be swapped out until tomorrow
 *  - a reward is only paid if the habit is active and the member hasn't already earned from
 *    that group's limit of different habits that day (this also covers step uploads for past days)
 */

const trusted = mongoose.trusted;

/** Every habit active (premium). */
export const allHabitLimits = () => Object.fromEntries(HABIT_GROUP_IDS.map(g => [g, HABIT_GROUPS[g].ids.length]));

/** [{ id, name, limit, total, ids }] for the app and admin. */
export const habitGroupsInfo = limits =>
  HABIT_GROUP_IDS.map(g => ({ id: g, name: HABIT_GROUPS[g].name, limit: limits[g], total: HABIT_GROUPS[g].ids.length, ids: HABIT_GROUPS[g].ids }));

/** The member's saved picks, cleaned up and trimmed to each group's limit (defaults until they pick). */
export function effectiveHabits(saved, limits) {
  const valid = [...new Set((saved || []).filter(id => ACTIVITY_IDS.includes(id)))];
  return HABIT_GROUP_IDS.flatMap(g => {
    const group = HABIT_GROUPS[g];
    const picks = valid.length ? valid.filter(id => group.ids.includes(id)) : group.defaults;
    return picks.slice(0, limits[g] ?? 0);
  });
}

/** Habits that earned FIT on a local date. */
export async function earnedHabitsOn(userId, date) {
  const ids = await Transaction.distinct('meta.activity', {
    user: userId,
    activityDate: date,
    category: trusted({ $in: ACTIVITY_CATEGORIES }),
    amount: trusted({ $gt: 0 }),
  });
  return ids.filter(Boolean);
}

/** Whether a habit may earn for this user on this date (ctx from rewardContext). */
export async function canEarnHabit(ctx, userId, habitId, date) {
  if (ctx.premium) {
    return true;
  }
  if (!ctx.activeHabits.includes(habitId)) {
    return false;
  }
  const group = groupOf(habitId);
  const earned = (await earnedHabitsOn(userId, date)).filter(id => groupOf(id) === group);
  return earned.includes(habitId) || earned.length < (ctx.habitLimits[group] ?? 0);
}

/** Throws when a free member tries to log a habit they haven't activated. */
export function assertHabitActive(ctx, habitId) {
  if (!ctx.activeHabits.includes(habitId)) {
    throw ApiError.badRequest(
      `${ACTIVITIES[habitId].name} isn't one of your active habits. Change your habits on the Today’s activity screen, or go Premium to unlock all of them.`,
      'HABIT_INACTIVE',
    );
  }
}

/** Habits that can't be swapped out today: they earned FIT or have a session running. */
async function lockedHabits(userId, date) {
  const [earned, sessions] = await Promise.all([
    earnedHabitsOn(userId, date),
    ActivitySession.distinct('activity', { user: userId, status: 'active' }),
  ]);
  return [...new Set([...earned, ...sessions])].filter(id => ACTIVITY_IDS.includes(id));
}

/** What the app shows in the habit picker. */
export async function habitSelectionInfo(user, ctx, date) {
  const groups = habitGroupsInfo(ctx.habitLimits);
  return {
    groups,
    limit: groups.reduce((s, g) => s + g.limit, 0),
    total: ACTIVITY_IDS.length,
    isPremium: ctx.premium,
    active: ctx.activeHabits,
    // False until the member has picked their own habits
    chosen: !!user.habitsChosenAt,
    locked: ctx.premium ? [] : await lockedHabits(user._id, date),
  };
}

/** PUT /activities/selection — { habits: [ids] }. Returns the saved picks. */
export async function setActiveHabits(user, ctx, habits, date) {
  const picks = [...new Set(habits)];
  if (picks.some(id => !ACTIVITY_IDS.includes(id))) {
    throw ApiError.badRequest('Unknown habit', 'VALIDATION_ERROR');
  }
  if (!picks.length) {
    throw ApiError.badRequest('Pick at least one habit', 'VALIDATION_ERROR');
  }
  if (!ctx.premium) {
    for (const g of HABIT_GROUP_IDS) {
      const limit = ctx.habitLimits[g] ?? 0;
      const count = picks.filter(id => groupOf(id) === g).length;
      if (count > limit) {
        throw ApiError.badRequest(
          `Free members can pick ${limit} ${HABIT_GROUPS[g].name.toLowerCase()} habit${limit === 1 ? '' : 's'}. Go Premium to unlock all of them.`,
          'HABIT_LIMIT',
        );
      }
    }
    const missing = (await lockedHabits(user._id, date)).filter(id => !picks.includes(id));
    if (missing.length) {
      const names = missing.map(id => ACTIVITIES[id].name).join(', ');
      throw ApiError.badRequest(`${names} already earned FIT or has a session running today, so it stays active until tomorrow.`, 'HABIT_LOCKED');
    }
  }
  user.activeHabits = picks;
  user.habitsChosenAt = new Date();
  await user.save();
  return picks;
}
