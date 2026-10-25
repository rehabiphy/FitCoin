import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Reward from '../models/Reward.js';
import Redemption from '../models/Redemption.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { MARKETPLACE_RULES } from '../config/progression.js';
import { MARKET_CATEGORIES } from '../seed/rewards.js';
import { getBalance } from './wallet.service.js';
import { creditOnce } from './rewards.service.js';
import { notify } from './notification.service.js';
import { todayKey } from '../utils/dates.js';

const trusted = mongoose.trusted;
const LOCK_MS = 15000;

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const feeFor = cost => Math.ceil(cost * MARKETPLACE_RULES.feeRate);

export const categories = () => ['All', ...MARKET_CATEGORIES];

export async function listRewards({ category, q } = {}) {
  const filter = { active: true };
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (q) {
    const re = trusted({ $regex: escapeRegex(q), $options: 'i' });
    filter.$or = [{ title: re }, { brand: re }];
  }
  const rewards = await Reward.find(filter).sort({ sort: 1, cost: 1 });
  return rewards.map(r => ({ ...r.toPublicJSON(), fee: feeFor(r.cost), total: r.cost + feeFor(r.cost) }));
}

async function findReward(idOrSlug) {
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug) };
  const reward = await Reward.findOne({ ...query, active: true });
  if (!reward) {
    throw ApiError.notFound('Reward not found');
  }
  return reward;
}

export async function getReward(idOrSlug) {
  const r = await findReward(idOrSlug);
  return { ...r.toPublicJSON(), fee: feeFor(r.cost), total: r.cost + feeFor(r.cost), feeRate: MARKETPLACE_RULES.feeRate };
}

/** Short exclusive lock on the user's wallet so concurrent redemptions can't overspend. */
async function lockWallet(userId) {
  const now = new Date();
  const locked = await User.findOneAndUpdate(
    { _id: userId, $or: [{ walletLockUntil: null }, { walletLockUntil: trusted({ $lt: now }) }] },
    { walletLockUntil: new Date(now.getTime() + LOCK_MS) },
  );
  if (!locked) {
    throw ApiError.conflict('Another redemption is in progress, please try again', 'WALLET_BUSY');
  }
}

const unlockWallet = userId => User.updateOne({ _id: userId }, { $unset: { walletLockUntil: 1 } });

/**
 * Placeholder for the partner voucher API: issues a code and completes the
 * redemption. Swap this for the real partner call when integrations exist.
 */
async function fulfil(redemption) {
  const code = `FIT-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  redemption.code = code;
  redemption.status = 'completed';
  await redemption.save();
  await Transaction.updateOne({ refKey: `redeem:${redemption._id}` }, { status: 'completed', 'meta.code': code });
  await notify(redemption.user, {
    type: 'redemption',
    title: 'Your voucher is ready',
    body: `${redemption.brand} ${redemption.title}: code ${code}. Find it in Wallet → History.`,
    icon: 'Gift',
    color: 'mint',
    dedupeKey: `redemption:${redemption._id}`,
  });
}

/** POST /marketplace/rewards/:id/redeem */
export async function redeem(userId, idOrSlug, tzOffset) {
  const reward = await findReward(idOrSlug);
  const fee = feeFor(reward.cost);
  const total = reward.cost + fee;

  await lockWallet(userId);
  let redemption;
  try {
    const balance = await getBalance(userId);
    if (balance < total) {
      throw ApiError.badRequest(`You need ${total} FIT but have ${balance}`, 'INSUFFICIENT_FUNDS');
    }
    if (reward.stock !== null) {
      const taken = await Reward.findOneAndUpdate(
        { _id: reward._id, stock: trusted({ $gt: 0 }) },
        { $inc: { stock: -1 } },
        { returnDocument: 'after' },
      );
      if (!taken) {
        throw ApiError.conflict('This reward is out of stock', 'OUT_OF_STOCK');
      }
    }

    redemption = await Redemption.create({
      user: userId,
      reward: reward._id,
      brand: reward.brand,
      title: reward.title,
      cost: reward.cost,
      fee,
      total,
      expiresAt: new Date(Date.now() + reward.validDays * 86400000),
    });
    const date = todayKey(tzOffset);
    await creditOnce({
      userId,
      refKey: `redeem:${redemption._id}`,
      amount: -reward.cost,
      type: 'redeem',
      category: 'marketplace',
      title: `${reward.brand} ${reward.title}`,
      subtitle: 'Marketplace redemption',
      activityDate: date,
      status: 'processing',
      meta: { redemption: redemption._id.toString() },
    });
    if (fee > 0) {
      await creditOnce({
        userId,
        refKey: `fee:${redemption._id}`,
        amount: -fee,
        type: 'fee',
        category: 'marketplace',
        title: 'Platform fee',
        subtitle: `${MARKETPLACE_RULES.feeRate * 100}% redemption fee`,
        activityDate: date,
        meta: { redemption: redemption._id.toString() },
      });
    }
  } finally {
    await unlockWallet(userId);
  }

  try {
    await fulfil(redemption);
  } catch (err) {
    // The FIT is reserved and the redemption stays "processing"; it can be fulfilled later
    console.error('Voucher fulfilment failed:', err);
  }
  return { redemption: redemption.toPublicJSON(), balance: await getBalance(userId) };
}

export async function listRedemptions(userId) {
  const rows = await Redemption.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
  return rows.map(r => r.toPublicJSON());
}
