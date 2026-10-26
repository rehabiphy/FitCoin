import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { rewardContext } from './premium.service.js';
import { EXPIRY_RULES, MARKETPLACE_RULES } from '../config/progression.js';
import { lastDays, todayKey } from '../utils/dates.js';

const round2 = n => Math.round(n * 100) / 100;

/**
 * Balance and stats, all calculated from the transaction ledger.
 * - balance: completed credits and debits, plus redemptions still processing (already reserved)
 * - pending: credits not yet confirmed
 */
export async function getWalletSummary(userOrId, tzOffset) {
  const user = new mongoose.Types.ObjectId(String(userOrId?._id ?? userOrId));
  const week = lastDays(tzOffset, 7);
  const today = todayKey(tzOffset);

  const [ctx, totals, weekly] = await Promise.all([
    rewardContext(userOrId),
    Transaction.aggregate([
      { $match: { user } },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$status', 'completed'] },
                    { $and: [{ $eq: ['$status', 'processing'] }, { $lt: ['$amount', 0] }] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          lifetime: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$amount', 0] }, { $eq: ['$status', 'completed'] }] }, '$amount', 0],
            },
          },
          redeemed: {
            $sum: { $cond: [{ $in: ['$type', ['redeem', 'fee']] }, { $abs: '$amount' }, 0] },
          },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { user, activityDate: { $in: week }, amount: { $gt: 0 }, status: 'completed' } },
      { $group: { _id: '$activityDate', value: { $sum: '$amount' } } },
    ]),
  ]);

  const t = totals[0] || { balance: 0, pending: 0, lifetime: 0, redeemed: 0 };
  const expiring = await expiringSoon(user, t.balance);
  const byDay = new Map(weekly.map(w => [w._id, w.value]));
  const weeklySeries = week.map(date => ({
    date,
    day: new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    value: round2(byDay.get(date) || 0),
  }));

  return {
    balance: round2(t.balance),
    pending: round2(t.pending),
    lifetime: round2(t.lifetime),
    redeemed: round2(t.redeemed),
    earnedToday: round2(byDay.get(today) || 0),
    earnedThisWeek: round2(weeklySeries.reduce((sum, d) => sum + d.value, 0)),
    dailyCap: ctx.dailyCap,
    isPremium: ctx.premium,
    multiplier: ctx.multiplier,
    weekly: weeklySeries,
    inrValue: round2(t.balance * MARKETPLACE_RULES.inrPerFit),
    expiringSoon: expiring.amount,
    expiryDate: expiring.date,
  };
}

/**
 * FIT expires 6 months after it was earned. This reports credits that reach
 * that age within the warning window (capped at the current balance, since
 * spending uses the oldest FIT first).
 */
async function expiringSoon(user, balance) {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setMonth(windowStart.getMonth() - EXPIRY_RULES.months);
  const windowEnd = new Date(windowStart.getTime() + EXPIRY_RULES.warnDays * 86400000);

  const [row] = await Transaction.aggregate([
    {
      $match: {
        user,
        amount: { $gt: 0 },
        status: 'completed',
        createdAt: { $gte: windowStart, $lt: windowEnd },
      },
    },
    { $group: { _id: null, amount: { $sum: '$amount' }, oldest: { $min: '$createdAt' } } },
  ]);
  if (!row || balance <= 0) {
    return { amount: 0, date: null };
  }
  const date = new Date(row.oldest);
  date.setMonth(date.getMonth() + EXPIRY_RULES.months);
  return { amount: round2(Math.min(row.amount, balance)), date };
}

/** Spendable balance (completed credits/debits plus redemptions still processing). */
export async function getBalance(userId) {
  const [row] = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$status', 'completed'] },
                  { $and: [{ $eq: ['$status', 'processing'] }, { $lt: ['$amount', 0] }] },
                ],
              },
              '$amount',
              0,
            ],
          },
        },
      },
    },
  ]);
  return round2(row?.balance || 0);
}

// App filter chips -> ledger types
const TYPE_GROUPS = {
  earned: ['earn', 'bonus'],
  redeemed: ['redeem'],
  other: ['fee', 'expire'],
};

export async function listTransactions(userId, { page = 1, limit = 20, type, group } = {}) {
  const types = group ? TYPE_GROUPS[group] : type ? [type] : null;
  const filter = { user: userId, ...(types ? { type: mongoose.trusted({ $in: types }) } : {}) };
  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);
  return {
    items: items.map(t => t.toPublicJSON()),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}

export async function getTransaction(userId, id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  return Transaction.findOne({ _id: id, user: userId });
}
