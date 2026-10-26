import AppSetting from '../models/AppSetting.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { HABIT_GROUPS, HABIT_GROUP_IDS, PREMIUM_DEFAULTS, WALLET_RULES } from '../config/rewards.js';

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

/** Live reward config (cached for a few seconds). */
export async function getRewardConfig() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.value;
  }
  const doc = await AppSetting.findOne({ key: KEY }).lean();
  const value = merge(doc?.value);
  cache = { value, at: Date.now() };
  return value;
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

/** Base FIT (before any premium multiplier) a day's value is worth for one habit. */
export function baseReward(activityId, rule, value) {
  const cfg = ACTIVITIES[activityId];
  if (cfg.rewardMode === 'goal') {
    return value >= rule.goal ? rule.maxReward : 0;
  }
  return Math.min(rule.maxReward, Math.floor(value / cfg.unitSize) * rule.perUnit);
}

const trim = n => Math.round(n * 100) / 100;

/** "6 FIT / 1k steps", "40 FIT / goal met" */
export function rateLabel(activityId, rule, multiplier = 1) {
  const cfg = ACTIVITIES[activityId];
  const amount = cfg.rewardMode === 'goal' ? rule.maxReward : rule.perUnit;
  return `${trim(amount * multiplier)} FIT / ${cfg.rateUnit}`;
}
