import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { REFERRAL_RULES } from '../config/progression.js';
import { activeDates, creditOnce } from './rewards.service.js';
import { notify } from './notification.service.js';
import { coinValue, getHalvingState } from './halving.service.js';
import { monthStartOf, todayKey } from '../utils/dates.js';

const trusted = mongoose.trusted;

/** Referral bonuses at today's values (halving and fixed amounts applied). */
async function liveRewards() {
  const state = await getHalvingState();
  return {
    referrerReward: coinValue(state, 'referral.referrer', REFERRAL_RULES.referrerReward),
    refereeReward: coinValue(state, 'referral.referee', REFERRAL_RULES.refereeReward),
  };
}

/**
 * Pays referral rewards once an invited friend has `activeDaysRequired` active days:
 * a welcome bonus for the friend and a bonus for the inviter (inviter capped per month).
 * Amounts are set in REFERRAL_RULES and follow the admin's halving.
 */
export async function checkReferralReward(user) {
  if (!user?.referredBy || user.referralRewardedAt) {
    return;
  }
  const days = await activeDates(user._id);
  if (days.length < REFERRAL_RULES.activeDaysRequired) {
    return;
  }

  // Claim atomically so this pays once even if two requests get here together
  const claimed = await User.findOneAndUpdate(
    { _id: user._id, referralRewardedAt: trusted({ $exists: false }) },
    { referralRewardedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!claimed) {
    return;
  }

  const today = todayKey(user.tzOffset || 0);
  const { referrerReward, refereeReward } = await liveRewards();
  if (refereeReward > 0) {
    await creditOnce({
      userId: user._id,
      refKey: `referral-welcome:${user._id}`,
      amount: refereeReward,
      category: 'referral',
      title: 'Welcome bonus',
      subtitle: 'Joined with a friend’s code',
      activityDate: today,
    });
    await notify(user._id, {
      type: 'referral',
      title: 'Welcome bonus credited',
      body: `+${refereeReward} FIT for completing ${REFERRAL_RULES.activeDaysRequired} active days.`,
      icon: 'Gift',
      color: 'mint',
      dedupeKey: `referral-welcome:${user._id}`,
    });
  }

  const referrer = await User.findById(user.referredBy);
  if (!referrer) {
    claimed.referralStatus = 'capped';
    await claimed.save();
    return;
  }
  const referrerToday = todayKey(referrer.tzOffset || 0);
  const rewardedThisMonth = await Transaction.countDocuments({
    user: referrer._id,
    category: 'referral',
    refKey: trusted({ $regex: '^referral:' }),
    activityDate: trusted({ $gte: monthStartOf(referrerToday) }),
  });

  if (rewardedThisMonth >= REFERRAL_RULES.maxRewardedPerMonth) {
    claimed.referralStatus = 'capped';
    await claimed.save();
    return;
  }

  if (referrerReward <= 0) {
    claimed.referralStatus = 'rewarded';
    await claimed.save();
    return;
  }
  await creditOnce({
    userId: referrer._id,
    refKey: `referral:${user._id}`,
    amount: referrerReward,
    category: 'referral',
    title: `Referral — ${user.name}`,
    subtitle: `Friend completed ${REFERRAL_RULES.activeDaysRequired} days`,
    activityDate: referrerToday,
  });
  claimed.referralStatus = 'rewarded';
  await claimed.save();
  await notify(referrer._id, {
    type: 'referral',
    title: 'Referral reward',
    body: `${user.name} completed ${REFERRAL_RULES.activeDaysRequired} active days. +${referrerReward} FIT for you!`,
    icon: 'Users',
    color: 'cyan',
    dedupeKey: `referral:${user._id}`,
  });
}

/** The referral screen: code, totals and each invited friend's status. */
export async function getReferralInfo(user) {
  const friends = await User.find({ referredBy: user._id }).sort({ createdAt: -1 }).limit(100);
  const [earned, paidRows, live] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: user._id, category: 'referral', refKey: { $regex: '^referral:' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // What was actually paid per friend (amounts change with halving)
    Transaction.find({
      user: user._id,
      category: 'referral',
      refKey: trusted({ $in: friends.filter(f => f.referralStatus === 'rewarded').map(f => `referral:${f._id}`) }),
    })
      .select('refKey amount')
      .lean(),
    liveRewards(),
  ]);
  const paidFor = new Map(paidRows.map(t => [t.refKey, t.amount]));

  const list = await Promise.all(
    friends.map(async f => {
      const rewarded = f.referralStatus === 'rewarded';
      let note;
      if (rewarded) {
        note = `Joined ${f.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (f.referralStatus === 'capped') {
        note = 'Monthly referral limit reached';
      } else {
        const days = (await activeDates(f._id)).length;
        note = `${Math.min(days, REFERRAL_RULES.activeDaysRequired)} / ${REFERRAL_RULES.activeDaysRequired} active days`;
      }
      return {
        id: f._id.toString(),
        name: f.name,
        avatar: f.avatar || null,
        status: rewarded ? 'Rewarded' : f.referralStatus === 'capped' ? 'Expired' : 'Pending',
        note,
        reward: rewarded ? paidFor.get(`referral:${f._id}`) || 0 : 0,
        joinedAt: f.createdAt,
      };
    }),
  );

  return {
    code: user.referralCode,
    rules: { ...REFERRAL_RULES, ...live },
    stats: {
      invited: friends.length,
      rewarded: list.filter(f => f.status === 'Rewarded').length,
      earned: earned[0]?.total || 0,
    },
    referrals: list,
  };
}
