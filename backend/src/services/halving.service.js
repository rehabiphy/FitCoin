import AppSetting from '../models/AppSetting.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { REFERRAL_RULES, STREAK_RULES } from '../config/progression.js';
import { periodLabel } from '../config/challenges.js';

/**
 * Coin halving. Every FIT amount the app pays (habit rates and daily maxes,
 * daily caps, streak bonus, referral bonuses, challenge prizes) is its base
 * value × ½^era. Era 0 pays the full base values, era 1 pays half, era 2 a
 * quarter, and so on. Admins halve manually or at a member-count target.
 *
 * Any single amount can be pinned to a fixed value (an "override"), which is
 * paid as-is and ignores the era.
 *
 * Stored as the "halving" AppSetting: { era, autoAtUsers, overrides: [{ key, value }], history }
 * (a list, because the keys contain dots, which MongoDB field names shouldn't).
 */

const KEY = 'halving';
const CACHE_MS = 15000;
export const MAX_ERA = 20;
const HISTORY_LIMIT = 100;

let cache = null; // { value, at }

const round2 = n => Math.round(n * 100) / 100;

export const factorOf = era => 0.5 ** era;

function normalize(stored = {}) {
  return {
    era: Number.isInteger(stored.era) && stored.era >= 0 ? stored.era : 0,
    autoAtUsers: Number.isInteger(stored.autoAtUsers) && stored.autoAtUsers > 0 ? stored.autoAtUsers : null,
    overrides: Object.fromEntries(
      (Array.isArray(stored.overrides) ? stored.overrides : [])
        .filter(o => typeof o?.key === 'string' && Number.isFinite(o.value) && o.value >= 0)
        .map(o => [o.key, o.value]),
    ),
    history: Array.isArray(stored.history) ? stored.history : [],
  };
}

/** Current halving state (cached for a few seconds, like the reward config). */
export async function getHalvingState({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.value;
  }
  const doc = await AppSetting.findOne({ key: KEY }).lean();
  const value = normalize(doc?.value);
  cache = { value, at: Date.now() };
  return value;
}

/** What members are paid for one amount: the admin's fixed value, otherwise the base halved once per era. */
export function coinValue(state, key, base) {
  const fixed = state.overrides[key];
  if (fixed !== undefined) {
    return fixed;
  }
  return round2((base || 0) * factorOf(state.era));
}

/** Live amount for one coin key (see coinValue). */
export async function coinAmount(key, base) {
  return coinValue(await getHalvingState(), key, base);
}

/**
 * Writes a new state, but only if the era is still `expectedEra`, so a halving
 * can never be applied twice (double click, two admins, auto + manual at once).
 */
async function write(expectedEra, state, adminId) {
  const value = { ...state, overrides: Object.entries(state.overrides).map(([key, v]) => ({ key, value: v })) };
  let doc;
  try {
    doc = await AppSetting.findOneAndUpdate(
      { key: KEY, 'value.era': expectedEra },
      { $set: { value, ...(adminId ? { updatedBy: adminId } : {}) } },
      { upsert: true, returnDocument: 'after' },
    ).lean();
  } catch (err) {
    if (err?.code !== 11000) {
      throw err;
    }
  }
  if (!doc) {
    throw ApiError.conflict('Halving was changed in the meantime. Reload and try again.', 'HALVING_CHANGED');
  }
  const next = normalize(doc.value);
  cache = { value: next, at: Date.now() };
  return next;
}

const historyWith = (state, entry) => [{ ...entry, at: new Date() }, ...state.history].slice(0, HISTORY_LIMIT);

/** Halves every amount once more. `fromEra` is the era the admin was looking at. */
export async function halve({ fromEra, admin, auto = false }) {
  const state = await getHalvingState({ fresh: true });
  if (fromEra !== state.era) {
    throw ApiError.conflict('Halving was changed in the meantime. Reload and try again.', 'HALVING_CHANGED');
  }
  if (state.era >= MAX_ERA) {
    throw ApiError.badRequest(`Rewards can be halved at most ${MAX_ERA} times`, 'MAX_HALVING');
  }
  const era = state.era + 1;
  const users = await User.estimatedDocumentCount();
  return write(
    state.era,
    {
      ...state,
      era,
      // An automatic target is used once; the admin sets the next one
      autoAtUsers: auto ? null : state.autoAtUsers,
      history: historyWith(state, { action: 'halve', era, users, auto, by: admin ? admin.name : 'Automatic' }),
    },
    admin?._id,
  );
}

/** Steps back one halving (for mistakes). */
export async function undoHalving({ fromEra, admin }) {
  const state = await getHalvingState({ fresh: true });
  if (fromEra !== state.era) {
    throw ApiError.conflict('Halving was changed in the meantime. Reload and try again.', 'HALVING_CHANGED');
  }
  if (state.era === 0) {
    throw ApiError.badRequest('Rewards are already at full value', 'NOTHING_TO_UNDO');
  }
  const era = state.era - 1;
  const users = await User.estimatedDocumentCount();
  return write(
    state.era,
    { ...state, era, history: historyWith(state, { action: 'undo', era, users, auto: false, by: admin.name }) },
    admin._id,
  );
}

/** Saves the fixed amounts and the automatic member target. */
export async function saveHalvingSettings({ fromEra, overrides, autoAtUsers, validKeys, admin }) {
  const state = await getHalvingState({ fresh: true });
  if (fromEra !== state.era) {
    throw ApiError.conflict('Halving was changed in the meantime. Reload and try again.', 'HALVING_CHANGED');
  }
  const unknown = Object.keys(overrides).filter(k => !validKeys.has(k));
  if (unknown.length) {
    throw ApiError.badRequest(`Unknown reward: ${unknown.join(', ')}`, 'UNKNOWN_REWARD');
  }
  if (autoAtUsers !== null && autoAtUsers !== state.autoAtUsers) {
    const users = await User.estimatedDocumentCount();
    if (autoAtUsers <= users) {
      throw ApiError.badRequest(`The target must be above the current ${users.toLocaleString('en-IN')} members`, 'TARGET_TOO_LOW');
    }
  }
  return write(state.era, { ...state, overrides, autoAtUsers }, admin._id);
}

/**
 * Called after a member signs up: halves automatically once the member count
 * reaches the admin's target. Never throws (sign-up must not fail because of it).
 */
export async function checkAutoHalving() {
  try {
    const state = await getHalvingState({ fresh: true });
    if (!state.autoAtUsers || state.era >= MAX_ERA) {
      return;
    }
    if ((await User.estimatedDocumentCount()) >= state.autoAtUsers) {
      await halve({ fromEra: state.era, auto: true });
    }
  } catch (err) {
    if (err?.code !== 'HALVING_CHANGED') {
      console.error('Automatic halving failed:', err);
    }
  }
}

/**
 * Every amount the app pays, with its base, halved and live value, for the admin panel.
 * `baseConfig` is the admin-set reward config (before halving); `challenges` the challenge docs.
 */
export function coinParts(baseConfig, challenges, state) {
  const part = (key, group, label, detail, base) => {
    const halved = round2(base * factorOf(state.era));
    const override = state.overrides[key];
    return { key, group, label, detail, base, halved, override: override ?? null, value: override ?? halved };
  };
  const parts = [];
  for (const id of ACTIVITY_IDS) {
    const a = ACTIVITIES[id];
    const h = baseConfig.habits[id];
    if (a.rewardMode === 'perUnit') {
      parts.push(part(`habit.${id}.perUnit`, 'habits', `${a.name} rate`, `FIT per ${a.rateUnit}`, h.perUnit));
    }
    parts.push(
      part(`habit.${id}.maxReward`, 'habits', `${a.name} daily max`, a.rewardMode === 'goal' ? 'FIT once the goal is met' : 'Most FIT a day', h.maxReward),
    );
  }
  parts.push(part('cap.free', 'caps', 'Daily cap — free', 'Most habit FIT a free member earns a day', baseConfig.dailyCap));
  parts.push(part('cap.premium', 'caps', 'Daily cap — premium', 'Most habit FIT a premium member earns a day', baseConfig.premium.dailyCap));
  parts.push(part('streak.bonus', 'bonuses', 'Streak bonus', `Every ${STREAK_RULES.bonusEvery} active days in a row`, STREAK_RULES.bonusAmount));
  parts.push(part('referral.referrer', 'bonuses', 'Referral — inviter', 'When a friend joins with their code', REFERRAL_RULES.referrerReward));
  parts.push(part('referral.referee', 'bonuses', 'Referral — welcome bonus', 'The friend who used the code', REFERRAL_RULES.refereeReward));
  for (const c of challenges) {
    parts.push(part(`challenge.${c.slug}`, 'challenges', c.title, `${periodLabel(c.period)} challenge prize`, c.reward));
  }
  return parts;
}
