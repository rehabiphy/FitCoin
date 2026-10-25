import { STEP_RULES } from '../config/rewards.js';
import { getDay, getDays, stepReward, syncSteps } from '../services/steps.service.js';
import { getWalletSummary } from '../services/wallet.service.js';
import { lastDays, todayKey } from '../utils/dates.js';

const goalOf = user => user.stepGoal || STEP_RULES.defaultGoal;

function todayPayload(user, day) {
  return {
    ...day,
    goal: goalOf(user),
    fitEarned: stepReward(day.steps),
    fitMax: STEP_RULES.maxMilestones * STEP_RULES.fitPerThousand,
  };
}

/**
 * POST /steps/sync
 * Body: { tzOffset, source, days: [{ date: "YYYY-MM-DD", steps }] }
 * The app sends the running total for today (and recent days it may not have uploaded yet).
 */
export async function sync(req, res) {
  const { days, source } = req.body;
  const tzOffset = req.body.tzOffset ?? req.tzOffset;
  const result = await syncSteps(req.user._id, days, { tzOffset, source });

  const [today, wallet] = await Promise.all([
    getDay(req.user._id, todayKey(tzOffset)),
    getWalletSummary(req.user._id, tzOffset),
  ]);

  res.json({
    success: true,
    data: { ...result, today: todayPayload(req.user, today), wallet },
  });
}

/** GET /steps/today?tzOffset=330 */
export async function today(req, res) {
  const tzOffset = req.validatedQuery.tzOffset ?? req.tzOffset;
  const day = await getDay(req.user._id, todayKey(tzOffset));
  res.json({ success: true, data: { today: todayPayload(req.user, day) } });
}

/** GET /steps/history?days=7&tzOffset=330 — oldest first, missing days are 0 */
export async function history(req, res) {
  const { days } = req.validatedQuery;
  const tzOffset = req.validatedQuery.tzOffset ?? req.tzOffset;
  const items = await getDays(req.user._id, lastDays(tzOffset, days));
  const total = items.reduce((sum, d) => sum + d.steps, 0);
  res.json({
    success: true,
    data: {
      days: items,
      goal: goalOf(req.user),
      totalSteps: total,
      averageSteps: Math.round(total / items.length),
      goalDays: items.filter(d => d.steps >= goalOf(req.user)).length,
    },
  });
}
