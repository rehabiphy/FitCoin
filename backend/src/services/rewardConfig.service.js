import AppSetting from '../models/AppSetting.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { HABIT_GROUPS, HABIT_GROUP_IDS, PREMIUM_DEFAULTS, WALLET_RULES } from '../config/rewards.js';
import { coinValue, getHalvingState } from './halving.service.js';

const KEY = 'rewards';
// Config changes reach every server process within this time
const CACHE_MS = 15000;

let cache = null; // { value, at }

/** The coin values the app ships with, used for anything the admin hasn't set. */
export function defaultRewardConfig() {
  return {
    dailyCap: WALLET_RULES.dailyCap,
    // Habits a free member can have active, per group
    freeHabitLimits: Object.fromEntries(HABIT_GROUP_IDS.map(g => [g, HABIT_GROUPS[g].freeLimit])),
    habits: Object.fromEntries(ACTIVITY_IDS.map(id => [id, { ...ACTIVITIES[id].defaults }])),
    premium: { ...PREMIUM_DEFAULTS, benefits: [...PREMIUM_DEFAULTS.benefits] },
  };
}

/** Stored values on top of the defaults, so new fields always have a value. */
function merge(stored = {}) {
  const base = defaultRewardConfig();
  return {
    dailyCap: stored.dailyCap ?? base.dailyCap,
    freeHabitLimits: Object.fromEntries(
      HABIT_GROUP_IDS.map(g => [g, Math.min(HABIT_GROUPS[g].ids.length, stored.freeHabitLimits?.[g] ?? base.freeHabitLimits[g])]),
    ),
    habits: Object.fromEntries(ACTIVITY_IDS.map(id => [id, { ...base.habits[id], ...(stored.habits?.[id] || {}) }])),
    premium: { ...base.premium, ...(stored.premium || {}) },
  };
}

/** The values set on the admin's Habit coins / Premium pages, before halving (cached for a few seconds). */
export async function getBaseRewardConfig() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.value;
  }
  const doc = await AppSetting.findOne({ key: KEY }).lean();
  const value = merge(doc?.value);
  cache = { value, at: Date.now() };
  return value;
}

/** Base config with the current halving (and any fixed amounts) applied. */
export function applyHalving(base, halving) {
  return {
    ...base,
    dailyCap: coinValue(halving, 'cap.free', base.dailyCap),
    habits: Object.fromEntries(
      ACTIVITY_IDS.map(id => {
        const h = base.habits[id];
        return [
          id,
          {
            ...h,
            perUnit: coinValue(halving, `habit.${id}.perUnit`, h.perUnit),
            maxReward: coinValue(halving, `habit.${id}.maxReward`, h.maxReward),
          },
        ];
      }),
    ),
    premium: { ...base.premium, dailyCap: coinValue(halving, 'cap.premium', base.premium.dailyCap) },
  };
}

/** Live reward config: what members are actually paid right now (halving applied). */
export async function getRewardConfig() {
  const [base, halving] = await Promise.all([getBaseRewardConfig(), getHalvingState()]);
  return applyHalving(base, halving);
}

/** Saves a full config from the admin panel (already validated). */
export async function saveRewardConfig(config, adminId) {
  const value = merge(config);
  await AppSetting.findOneAndUpdate(
    { key: KEY },
    { $set: { value, updatedBy: adminId } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  cache = { value, at: Date.now() };
  return value;
}

export async function rewardConfigMeta() {
  const doc = await AppSetting.findOne({ key: KEY }).select('updatedAt updatedBy').populate('updatedBy', 'name email').lean();
  return doc ? { updatedAt: doc.updatedAt, updatedBy: doc.updatedBy ? { name: doc.updatedBy.name, email: doc.updatedBy.email } : null } : null;
}

const trim = n => Math.round(n * 100) / 100;

/** Base FIT (before any premium multiplier) a day's value is worth for one habit. */
export function baseReward(activityId, rule, value) {
  const cfg = ACTIVITIES[activityId];
  if (cfg.rewardMode === 'goal') {
    return value >= rule.goal ? rule.maxReward : 0;
  }
  return trim(Math.min(rule.maxReward, Math.floor(value / cfg.unitSize) * rule.perUnit));
}

/** "6 FIT / 1k steps", "40 FIT / goal met" */
export function rateLabel(activityId, rule, multiplier = 1) {
  const cfg = ACTIVITIES[activityId];
  const amount = cfg.rewardMode === 'goal' ? rule.maxReward : rule.perUnit;
  return `${trim(amount * multiplier)} FIT / ${cfg.rateUnit}`;
}
