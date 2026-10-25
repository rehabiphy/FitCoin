import mongoose from 'mongoose';
import User from '../models/User.js';
import UserBadge from '../models/UserBadge.js';
import DailyActivity from '../models/DailyActivity.js';
import ActivitySession from '../models/ActivitySession.js';
import { BADGES } from '../config/badges.js';
import { activeDates } from './rewards.service.js';
import { userRank } from './leaderboard.service.js';
import { notify } from './notification.service.js';

const trusted = mongoose.trusted;

/** Every number a badge rule can depend on. */
async function badgeMetrics(user) {
  const userId = user._id;
  const [dates, waterGoalDays, sleepLogs, cycleRows, breatheSessions, rewardedReferrals, weekly] = await Promise.all([
    activeDates(userId),
    DailyActivity.countDocuments({ user: userId, activity: 'water', value: trusted({ $gte: 8 }) }),
    DailyActivity.countDocuments({ user: userId, activity: 'sleep', value: trusted({ $gt: 0 }) }),
    DailyActivity.find({ user: userId, activity: 'cycle' }).select('value'),
    ActivitySession.countDocuments({ user: userId, activity: 'breathe', status: 'completed', creditedValue: trusted({ $gt: 0 }) }),
    User.countDocuments({ referredBy: userId, referralStatus: 'rewarded' }),
    userRank(userId, 'weekly', user.tzOffset || 0),
  ]);
  return {
    activeDays: dates.length,
    bestStreak: user.bestStreak || 0,
    waterGoalDays,
    sleepLogs,
    cycleKm: Math.floor(cycleRows.reduce((s, r) => s + r.value, 0)),
    breatheSessions,
    weeklyTop10: weekly.rank && weekly.rank <= 10 ? 1 : 0,
    rewardedReferrals,
  };
}

/**
 * Checks every badge, stores newly earned ones (with a notification) and
 * returns the full list with progress. Earned badges are never taken away.
 */
export async function evaluateBadges(userOrId) {
  const user = userOrId?._id ? userOrId : await User.findById(userOrId);
  if (!user) {
    return [];
  }
  const [metrics, owned] = await Promise.all([badgeMetrics(user), UserBadge.find({ user: user._id })]);
  const ownedAt = new Map(owned.map(b => [b.badge, b.earnedAt]));

  const result = [];
  for (const b of BADGES) {
    const value = metrics[b.metric] || 0;
    let earnedAt = ownedAt.get(b.id);
    if (!earnedAt && value >= b.target) {
      try {
        const created = await UserBadge.create({ user: user._id, badge: b.id });
        earnedAt = created.earnedAt;
        await notify(user._id, {
          type: 'badge',
          title: 'New badge unlocked',
          body: `You earned “${b.name}” — ${b.desc.toLowerCase()}.`,
          icon: b.icon,
          color: b.color,
          dedupeKey: `badge:${user._id}:${b.id}`,
        });
      } catch (err) {
        if (err?.code !== 11000) {
          throw err;
        }
        earnedAt = new Date();
      }
    }
    result.push({
      id: b.id,
      name: b.name,
      icon: b.icon,
      color: b.color,
      desc: b.desc,
      earned: !!earnedAt,
      earnedAt: earnedAt || null,
      progress: Math.min(1, value / b.target),
      progressValue: Math.min(value, b.target),
      target: b.target,
    });
  }
  return result;
}
