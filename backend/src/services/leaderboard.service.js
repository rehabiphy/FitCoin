import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { addDays, mondayOf, monthStartOf, todayKey } from '../utils/dates.js';

/** First local date included in a leaderboard period, or null for all time. */
export function periodStart(period, tzOffset) {
  const today = todayKey(tzOffset);
  if (period === 'weekly') {
    return mondayOf(today);
  }
  if (period === 'monthly') {
    return monthStartOf(today);
  }
  return null;
}

/** Points = FIT earned (rewards + bonuses) during the period. */
function pointsMatch(start, userId) {
  return {
    ...(userId ? { user: new mongoose.Types.ObjectId(String(userId)) } : {}),
    type: { $in: ['earn', 'bonus'] },
    status: 'completed',
    amount: { $gt: 0 },
    ...(start ? { activityDate: { $gte: start } } : {}),
  };
}

/** Live streak: only counts if the user was active today or yesterday. */
export function liveStreak(user, tzOffset) {
  if (!user?.lastActiveDate) {
    return 0;
  }
  const today = todayKey(tzOffset);
  return user.lastActiveDate >= addDays(today, -1) ? user.currentStreak || 0 : 0;
}

export async function userPoints(userId, period, tzOffset) {
  const [row] = await Transaction.aggregate([
    { $match: pointsMatch(periodStart(period, tzOffset), userId) },
    { $group: { _id: null, points: { $sum: '$amount' } } },
  ]);
  return Math.round(row?.points || 0);
}

/** Rank of a user (1-based) and how many points they need to pass the next person. */
export async function userRank(userId, period, tzOffset) {
  const start = periodStart(period, tzOffset);
  const points = await userPoints(userId, period, tzOffset);
  const [ahead] = await Transaction.aggregate([
    { $match: pointsMatch(start) },
    { $group: { _id: '$user', points: { $sum: '$amount' } } },
    { $match: { points: { $gt: points } } },
    { $group: { _id: null, count: { $sum: 1 }, nextPoints: { $min: '$points' } } },
  ]);
  const rank = (ahead?.count || 0) + 1;
  return {
    rank: points > 0 ? rank : null,
    points,
    pointsToNext: ahead ? Math.max(1, Math.ceil(ahead.nextPoints - points) + 1) : 0,
  };
}

export async function getLeaderboard({ period = 'weekly', tzOffset = 0, userId, limit = 50 }) {
  const start = periodStart(period, tzOffset);
  const rows = await Transaction.aggregate([
    { $match: pointsMatch(start) },
    { $group: { _id: '$user', points: { $sum: '$amount' } } },
    { $sort: { points: -1, _id: 1 } },
    { $limit: limit },
  ]);

  const users = await User.find({ _id: mongoose.trusted({ $in: rows.map(r => r._id) }) }).select(
    'name avatar currentStreak lastActiveDate',
  );
  const byId = new Map(users.map(u => [u._id.toString(), u]));

  const entries = rows
    .map((r, i) => {
      const u = byId.get(r._id.toString());
      if (!u) {
        return null;
      }
      return {
        rank: i + 1,
        userId: r._id.toString(),
        name: u.name,
        avatar: u.avatar || null,
        points: Math.round(r.points),
        streak: liveStreak(u, tzOffset),
        isMe: userId ? r._id.toString() === userId.toString() : false,
      };
    })
    .filter(Boolean);

  const me = userId ? await userRank(userId, period, tzOffset) : null;
  return { period, since: start, entries, me };
}
