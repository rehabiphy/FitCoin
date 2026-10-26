import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const trusted = mongoose.trusted;
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Headline numbers for the admin dashboard. */
export async function getOverview() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const [users, premiumUsers, newUsers, issued] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ premiumUntil: trusted({ $gt: now }) }),
    User.countDocuments({ createdAt: trusted({ $gte: dayAgo }) }),
    Transaction.aggregate([
      { $match: { createdAt: { $gte: dayAgo }, amount: { $gt: 0 }, status: 'completed' } },
      { $group: { _id: { $gt: [{ $ifNull: ['$meta.multiplier', 1] }, 1] }, amount: { $sum: '$amount' } } },
    ]),
  ]);
  const premiumFit = issued.find(r => r._id === true)?.amount || 0;
  const freeFit = issued.find(r => r._id === false)?.amount || 0;
  return {
    users,
    premiumUsers,
    newUsers24h: newUsers,
    fitIssued24h: Math.round((premiumFit + freeFit) * 100) / 100,
    premiumFitIssued24h: Math.round(premiumFit * 100) / 100,
  };
}

const userRow = u => ({
  id: u._id.toString(),
  name: u.name,
  email: u.email,
  role: u.role,
  isPremium: !!u.premiumUntil && u.premiumUntil > new Date(),
  premiumSince: u.premiumSince || null,
  premiumUntil: u.premiumUntil || null,
  premiumSource: u.premiumSource || null,
  currentStreak: u.currentStreak || 0,
  lastLoginAt: u.lastLoginAt || null,
  createdAt: u.createdAt,
});

export async function listUsers({ q, premium, page, limit }) {
  const filter = {};
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = trusted([{ name: re }, { email: re }]);
  }
  if (premium === 'premium') {
    filter.premiumUntil = trusted({ $gt: new Date() });
  } else if (premium === 'free') {
    filter.$and = trusted([{ $or: [{ premiumUntil: { $exists: false } }, { premiumUntil: null }, { premiumUntil: { $lte: new Date() } }] }]);
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return { items: items.map(userRow), page, limit, total, hasMore: page * limit < total };
}

export const toUserRow = user => userRow(user.toObject ? user.toObject() : user);
