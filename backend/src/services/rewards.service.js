import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { notify } from './notification.service.js';

const trusted = mongoose.trusted;

// Rewards for daily habits; these count toward the daily earning cap and toward "active days"
export const ACTIVITY_CATEGORIES = ['steps', 'activity'];

/** Sum of daily habit rewards already credited for a user on a local date, excluding one ledger row. */
async function habitRewardsOn(userId, date, excludeRefKey) {
  const rows = await Transaction.find({
    user: userId,
    activityDate: date,
    category: trusted({ $in: ACTIVITY_CATEGORIES }),
    refKey: trusted({ $ne: excludeRefKey }),
  }).select('amount');
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

/**
 * Credits the reward for one habit on one day. There is one ledger row per
 * user + habit + day, only ever raised with $max — so repeated or simultaneous
 * calls can't pay twice. Applies the user's daily cap across all habits
 * (free and premium caps are set in the admin panel, see premium.service.js).
 *
 * Returns the FIT newly added by this call.
 */
export async function creditDailyReward({
  userId,
  date,
  key, // e.g. "steps" or "act-water"
  amount,
  dailyCap,
  category,
  title,
  goalTitle,
  goalReached = false,
  subtitle,
  meta = {},
  goalNotification, // { title, body, icon, color } sent once when the goal is first reached
}) {
  if (amount <= 0) {
    return 0;
  }
  const refKey = `${key}:${userId}:${date}`;
  const others = await habitRewardsOn(userId, date, refKey);
  const allowed = Math.max(0, Math.min(amount, dailyCap - others));
  if (allowed <= 0) {
    return 0;
  }

  const update = {
    $max: { amount: allowed },
    $set: { subtitle, meta: { ...meta, cappedFrom: allowed < amount ? amount : undefined } },
    $setOnInsert: {
      user: userId,
      type: 'earn',
      category,
      title: goalReached && goalTitle ? goalTitle : title,
      status: 'completed',
      activityDate: date,
    },
  };
  const options = { upsert: true, returnDocument: 'before' };

  let before;
  try {
    before = await Transaction.findOneAndUpdate({ refKey }, update, options);
  } catch (err) {
    if (err?.code !== 11000) {
      throw err;
    }
    before = await Transaction.findOneAndUpdate({ refKey }, update, options);
  }

  if (goalReached && goalTitle && before && before.title !== goalTitle) {
    await Transaction.updateOne({ refKey }, { $set: { title: goalTitle } });
  }
  if (goalReached && goalNotification) {
    await notify(userId, { type: 'reward', ...goalNotification, dedupeKey: `goal:${refKey}` });
  }

  return Math.max(0, allowed - (before?.amount || 0));
}

/**
 * A one-off credit or debit (bonus, referral, challenge prize, redemption).
 * `refKey` makes it idempotent: returns the new transaction, or null if it already existed.
 */
export async function creditOnce({ userId, refKey, amount, type = 'bonus', category, title, subtitle, activityDate, status = 'completed', meta }) {
  try {
    return await Transaction.create({
      user: userId,
      refKey,
      amount,
      type,
      category,
      title,
      subtitle,
      activityDate,
      status,
      meta,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return null;
    }
    throw err;
  }
}

/** Every local date on which the user earned a habit reward (their "active days"), sorted. */
export async function activeDates(userId) {
  const dates = await Transaction.distinct('activityDate', {
    user: userId,
    category: trusted({ $in: ACTIVITY_CATEGORIES }),
    amount: trusted({ $gt: 0 }),
  });
  return dates.filter(Boolean).sort();
}
