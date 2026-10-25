import mongoose from 'mongoose';
import StepDay from '../models/StepDay.js';
import { STEP_RULES } from '../config/rewards.js';
import { creditDailyReward } from './rewards.service.js';
import { afterActivity } from './progress.service.js';
import { addDays, minutesSinceMidnight, todayKey } from '../utils/dates.js';

/** FIT a given step count is worth for one day. */
export const stepReward = steps =>
  Math.min(STEP_RULES.maxMilestones, Math.floor(steps / 1000)) * STEP_RULES.fitPerThousand;

/**
 * Returns null if the upload is acceptable, otherwise the reason it was rejected.
 * Impossible numbers are rejected outright rather than trimmed, so faked data earns nothing.
 */
function rejectReason(date, steps, tzOffset, existing) {
  const today = todayKey(tzOffset);
  if (date > today || date < addDays(today, -STEP_RULES.maxBackfillDays)) {
    return 'DATE_OUT_OF_RANGE';
  }
  if (steps > STEP_RULES.maxDailySteps) {
    return 'IMPLAUSIBLE_STEPS';
  }
  if (date === today && steps > (minutesSinceMidnight(tzOffset) + 1) * STEP_RULES.maxStepsPerMinute) {
    return 'IMPLAUSIBLE_STEPS';
  }
  // Steps added since the last upload must fit in the time that has passed (same bound the phone uses)
  if (existing?.lastSyncedAt && steps > existing.steps) {
    const minutes = Math.max(0, (Date.now() - existing.lastSyncedAt.getTime()) / 60000);
    if (steps - existing.steps > (minutes + 1) * STEP_RULES.maxStepsPerMinute) {
      return 'IMPLAUSIBLE_STEPS';
    }
  }
  return null;
}

async function upsertDay(userId, date, steps, source) {
  const update = { $max: { steps }, $set: { lastSyncedAt: new Date(), source } };
  const options = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true };
  try {
    return await StepDay.findOneAndUpdate({ user: userId, date }, update, options);
  } catch (err) {
    // Two uploads creating the same day at once: the loser just updates the winner's row
    if (err?.code === 11000) {
      return StepDay.findOneAndUpdate({ user: userId, date }, update, options);
    }
    throw err;
  }
}

/**
 * Credits the day's step reward (one ledger row per user+day, only ever raised,
 * so repeated or concurrent uploads can never pay twice). Returns FIT newly added.
 */
function creditStepReward(userId, date, steps) {
  const goalReached = steps >= STEP_RULES.defaultGoal;
  return creditDailyReward({
    userId,
    date,
    key: 'steps',
    amount: stepReward(steps),
    category: 'steps',
    title: 'Step reward',
    goalTitle: 'Daily step goal',
    goalReached,
    subtitle: `Walking · ${steps.toLocaleString('en-US')} steps`,
    meta: { activity: 'walk', steps },
    goalNotification: {
      title: 'Step goal reached!',
      body: `${steps.toLocaleString('en-US')} steps today. You've earned the full ${stepReward(steps)} FIT — keep going!`,
      icon: 'Footprints',
      color: 'mint',
    },
  });
}

/**
 * Stores uploaded daily totals and credits FIT for them.
 * @param {string} userId
 * @param {{date: string, steps: number}[]} days
 * @param {{tzOffset: number, source: string}} options
 */
export async function syncSteps(userId, days, { tzOffset, source }) {
  const results = [];
  let awarded = 0;

  // trusted(): our own operator, exempt from the global filter sanitising in app.js
  const existing = await StepDay.find({ user: userId, date: mongoose.trusted({ $in: days.map(d => d.date) }) });
  const byDate = new Map(existing.map(d => [d.date, d]));

  for (const { date, steps } of days) {
    const reason = rejectReason(date, steps, tzOffset, byDate.get(date));
    if (reason) {
      results.push({ date, accepted: false, reason, steps: byDate.get(date)?.steps || 0 });
      continue;
    }
    const day = await upsertDay(userId, date, steps, source);
    const added = await creditStepReward(userId, date, day.steps);
    awarded += added;
    if (added > 0) {
      await afterActivity(userId, date);
    }
    results.push({ date, accepted: true, steps: day.steps, fitAdded: added });
  }

  return { days: results, fitAwarded: awarded };
}

export async function getDay(userId, date) {
  const day = await StepDay.findOne({ user: userId, date });
  return { date, steps: day?.steps || 0, lastSyncedAt: day?.lastSyncedAt || null };
}

/** Daily totals for the given dates (missing days are 0). */
export async function getDays(userId, dates) {
  const rows = await StepDay.find({ user: userId, date: mongoose.trusted({ $in: dates }) });
  const byDate = new Map(rows.map(r => [r.date, r.steps]));
  return dates.map(date => ({ date, steps: byDate.get(date) || 0, fit: stepReward(byDate.get(date) || 0) }));
}
