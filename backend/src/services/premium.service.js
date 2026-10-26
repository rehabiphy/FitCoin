import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { getRewardConfig, rateLabel } from './rewardConfig.service.js';
import { notify } from './notification.service.js';
import { allHabitLimits, effectiveHabits, habitGroupsInfo } from './habits.service.js';

const DAY_MS = 86400000;

const isActive = until => !!until && new Date(until).getTime() > Date.now();

/**
 * Everything needed to price a reward for one user: the live config, whether
 * they're premium, their multiplier and their daily cap.
 * Accepts a user document (with premiumUntil) or a user id.
 */
export async function rewardContext(userOrId) {
  const config = await getRewardConfig();
  const user = userOrId instanceof User ? userOrId : await User.findById(userOrId).select('premiumUntil activeHabits').lean();
  // Switching premium off in the admin panel pauses the bonus for everyone
  const premium = config.premium.enabled && isActive(user?.premiumUntil);
  return {
    config,
    premium,
    multiplier: premium ? config.premium.multiplier : 1,
    dailyCap: premium ? config.premium.dailyCap : config.dailyCap,
    // Habits that can earn, per group; free members are limited to the ones they picked
    habitLimits: premium ? allHabitLimits() : config.freeHabitLimits,
    activeHabits: premium ? [...ACTIVITY_IDS] : effectiveHabits(user?.activeHabits, config.freeHabitLimits),
  };
}

/** Applies the user's multiplier to a base reward. */
export const applyMultiplier = (ctx, base) => Math.round(base * ctx.multiplier);

/** Per-habit free vs premium rates, for the app's premium and rules screens. */
function habitRates(config) {
  const m = config.premium.multiplier;
  return ACTIVITY_IDS.map(id => {
    const rule = config.habits[id];
    return {
      id,
      name: ACTIVITIES[id].name,
      unit: ACTIVITIES[id].unit,
      rate: rateLabel(id, rule),
      premiumRate: rateLabel(id, rule, m),
      maxReward: rule.maxReward,
      premiumMaxReward: Math.round(rule.maxReward * m),
      goal: rule.goal,
    };
  });
}

function statusOf(user) {
  const active = isActive(user.premiumUntil);
  return {
    active,
    since: active ? user.premiumSince || null : null,
    until: active ? user.premiumUntil : null,
    daysLeft: active ? Math.ceil((new Date(user.premiumUntil).getTime() - Date.now()) / DAY_MS) : 0,
    // Had premium before but it ran out
    expired: !active && !!user.premiumUntil,
  };
}

/** GET /premium — the plan (as set in the admin panel), the user's status and rates. */
export async function getPremiumInfo(user) {
  const config = await getRewardConfig();
  const p = config.premium;
  const habits = habitRates(config);
  return {
    plan: {
      enabled: p.enabled,
      title: p.title,
      tagline: p.tagline,
      multiplier: p.multiplier,
      price: p.price,
      currency: p.currency,
      durationDays: p.durationDays,
      benefits: p.benefits,
      showPopup: p.enabled && p.showPopup,
      // e.g. [{ id: 'movement', name: 'Movement', limit: 1, total: 2 }, …]
      freeHabitGroups: habitGroupsInfo(config.freeHabitLimits),
      freeHabitLimit: Object.values(config.freeHabitLimits).reduce((s, n) => s + n, 0),
      totalHabits: ACTIVITY_IDS.length,
      dailyCap: p.dailyCap,
      freeDailyCap: config.dailyCap,
      maxDaily: habits.reduce((s, h) => s + h.maxReward, 0),
      premiumMaxDaily: habits.reduce((s, h) => s + h.premiumMaxReward, 0),
    },
    status: statusOf(user),
    habits,
    // False until real payments are connected (and test purchases are off)
    canPurchase: p.enabled && env.premiumTestPurchases,
  };
}

/** Extends premium from the later of now / the current end date. */
async function extendPremium(userId, days, source) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  const now = Date.now();
  const from = isActive(user.premiumUntil) ? user.premiumUntil.getTime() : now;
  if (!isActive(user.premiumUntil)) {
    user.premiumSince = new Date(now);
  }
  user.premiumUntil = new Date(from + days * DAY_MS);
  user.premiumSource = source;
  await user.save();
  return user;
}

/**
 * POST /premium/upgrade
 * Payment hook: verify the store receipt here (Google Play Billing / App Store)
 * before calling extendPremium with source 'purchase'. Until then only test
 * purchases are allowed, controlled by PREMIUM_TEST_PURCHASES.
 */
export async function upgrade(user) {
  const config = await getRewardConfig();
  const p = config.premium;
  if (!p.enabled) {
    throw ApiError.badRequest('Premium is not available right now', 'PREMIUM_DISABLED');
  }
  if (!env.premiumTestPurchases) {
    throw new ApiError(501, 'Payments are not available yet. Please try again later.', 'PAYMENTS_NOT_CONFIGURED');
  }
  const updated = await extendPremium(user._id, p.durationDays, 'test');
  await notify(updated._id, {
    type: 'system',
    title: `Welcome to ${p.title}!`,
    body: `You now earn ${p.multiplier}x FIT on every habit, with a daily cap of ${p.dailyCap} FIT.`,
    icon: 'Crown',
    color: 'gold',
    dedupeKey: `premium:${updated._id}:${updated.premiumUntil.getTime()}`,
  });
  return { user: updated.toPublicJSON(), ...(await getPremiumInfo(updated)) };
}

/* ---------- Admin ---------- */

export async function grantPremium(userId, days) {
  if (!mongoose.isValidObjectId(userId)) {
    throw ApiError.notFound('User not found');
  }
  const user = await extendPremium(userId, days, 'admin');
  const config = await getRewardConfig();
  await notify(user._id, {
    type: 'system',
    title: `You've got ${config.premium.title}!`,
    body: `Enjoy ${config.premium.multiplier}x FIT on every habit for the next ${days} days.`,
    icon: 'Crown',
    color: 'gold',
    dedupeKey: `premium:${user._id}:${user.premiumUntil.getTime()}`,
  });
  return user;
}

export async function revokePremium(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    throw ApiError.notFound('User not found');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  // Ending it now (rather than clearing it) keeps the "had premium before" history
  if (isActive(user.premiumUntil)) {
    user.premiumUntil = new Date();
    await user.save();
  }
  return user;
}
