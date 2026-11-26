import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { REFERRAL_RULES } from '../config/progression.js';
import { creditOnce } from './rewards.service.js';
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

/** Codes are shown upper case; links and typing may not be. Old "FIT-" codes now start with "AXYIO-". */
export const normalizeCode = code =>
  String(code || '')
    .trim()
    .toUpperCase()
    .replace(/^FIT-/, 'AXYIO-');

/**
 * Finds a member by their current code (PART9801) or one they had before
 * (AXYIO-PARTH34CE, or FIT-PARTH34CE for a few that were never renamed).
 */
const codeQuery = code => {
  const normalized = normalizeCode(code);
  const variants = [normalized, normalized.replace(/^AXYIO-/, 'FIT-')];
  return { $or: [{ referralCode: trusted({ $in: variants }) }, { legacyReferralCodes: trusted({ $in: variants }) }] };
};

const firstName = name => String(name || '').trim().split(/\s+/)[0] || 'A friend';

/** Who owns a code, for the invite page and the sign-up form. Only the first name is shared. */
export async function lookupCode(code) {
  const owner = await User.findOne(codeQuery(code)).select('name referralCode').lean();
  if (!owner) {
    throw ApiError.notFound('This invite code doesn’t exist', 'INVALID_REFERRAL');
  }
  const { refereeReward } = await liveRewards();
  return { code: owner.referralCode, name: firstName(owner.name), reward: refereeReward };
}

/** The member's own referrer, for "You joined with X's code". */
async function referrerSummary(user) {
  if (!user.referredBy) {
    return null;
  }
  const referrer = await User.findById(user.referredBy).select('name referralCode').lean();
  return {
    name: referrer?.name || 'a deleted account',
    code: referrer?.referralCode || null,
    appliedAt: user.referredAt || user.createdAt,
  };
}

/**
 * Checks a code before it is used. Throws a member-friendly error for an
 * unknown code, the member's own code, or a code from someone they invited.
 */
export async function resolveReferrer(code, user = null) {
  const referrer = await User.findOne(codeQuery(code)).select('_id name referredBy');
  if (!referrer) {
    throw ApiError.badRequest('This referral code isn’t valid. Check it and try again.', 'INVALID_REFERRAL');
  }
  if (user) {
    if (referrer._id.equals(user._id)) {
      throw ApiError.badRequest('That’s your own code. Enter a friend’s code instead.', 'SELF_REFERRAL');
    }
    if (referrer.referredBy && referrer.referredBy.equals(user._id)) {
      throw ApiError.badRequest(`${firstName(referrer.name)} joined with your code, so you can’t use theirs.`, 'MUTUAL_REFERRAL');
    }
  }
  return referrer;
}

/**
 * Reserves one of the inviter's paid referrals for this month, atomically, so
 * friends joining at the same moment can't push them past the monthly cap.
 * Returns false when the month is full.
 */
async function claimMonthlySlot(referrer, month) {
  // The counter is new: a month it hasn't seen yet starts from what was already paid in it
  let startFrom = 0;
  if (referrer.referralMonth !== month) {
    startFrom = await Transaction.countDocuments({
      user: referrer._id,
      category: 'referral',
      refKey: trusted({ $regex: '^referral:' }),
      activityDate: trusted({ $gte: month }),
    });
    if (startFrom >= REFERRAL_RULES.maxRewardedPerMonth) {
      return false;
    }
  }
  // Raw driver call: the filter uses operators and the update is a pipeline
  const claimed = await User.collection.findOneAndUpdate(
    {
      _id: referrer._id,
      $or: [{ referralMonth: { $ne: month } }, { referralMonthCount: { $lt: REFERRAL_RULES.maxRewardedPerMonth } }],
    },
    [
      {
        $set: {
          referralMonthCount: {
            $cond: [{ $eq: ['$referralMonth', month] }, { $add: [{ $ifNull: ['$referralMonthCount', 0] }, 1] }, startFrom + 1],
          },
          referralMonth: month,
        },
      },
    ],
    { returnDocument: 'after' },
  );
  return !!claimed;
}

/**
 * Pays a referral once: the welcome bonus to the member and the inviter's
 * bonus (unless the inviter hit this month's limit). Safe to call again: the
 * claim on `referralRewardedAt` and the transaction refKeys make it pay once.
 */
export async function payReferral(user) {
  if (!user?.referredBy || user.referralRewardedAt) {
    return null;
  }
  // Claim atomically so this pays once even if two requests get here together
  const claimed = await User.findOneAndUpdate(
    { _id: user._id, referralRewardedAt: trusted({ $exists: false }) },
    { referralRewardedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!claimed) {
    return null;
  }

  const { referrerReward, refereeReward } = await liveRewards();
  const referrer = await User.findById(claimed.referredBy);
  const referrerName = firstName(referrer?.name);

  let welcome = 0;
  if (refereeReward > 0) {
    const tx = await creditOnce({
      userId: claimed._id,
      refKey: `referral-welcome:${claimed._id}`,
      amount: refereeReward,
      category: 'referral',
      title: 'Welcome bonus',
      subtitle: `Joined with ${referrerName}’s code`,
      activityDate: todayKey(claimed.tzOffset || 0),
    });
    if (tx) {
      welcome = refereeReward;
      await notify(claimed._id, {
        type: 'referral',
        title: 'Welcome bonus credited',
        body: `+${refereeReward} axyio for joining with ${referrerName}’s code.`,
        icon: 'Gift',
        color: 'mint',
        dedupeKey: `referral-welcome:${claimed._id}`,
      });
    }
  }

  let status = 'rewarded';
  if (!referrer) {
    status = 'capped';
  } else {
    const referrerToday = todayKey(referrer.tzOffset || 0);
    if (!(await claimMonthlySlot(referrer, monthStartOf(referrerToday)))) {
      status = 'capped';
    } else if (referrerReward > 0) {
      await creditOnce({
        userId: referrer._id,
        refKey: `referral:${claimed._id}`,
        amount: referrerReward,
        category: 'referral',
        title: `Referral — ${claimed.name}`,
        subtitle: 'Joined with your code',
        activityDate: referrerToday,
      });
      await notify(referrer._id, {
        type: 'referral',
        title: 'Referral reward',
        body: `${claimed.name} joined with your code. +${referrerReward} axyio for you!`,
        icon: 'Users',
        color: 'cyan',
        dedupeKey: `referral:${claimed._id}`,
      });
    }
  }
  claimed.referralStatus = status;
  await claimed.save();
  return { welcome };
}

/**
 * Adds a friend's code to a member's account and pays both of them. A code can
 * be added once only; trying again says whose code is already on the account.
 */
export async function applyReferralCode(user, code) {
  const existing = await referrerSummary(user);
  if (existing) {
    throw ApiError.conflict(
      `You’ve already joined with ${existing.name}’s code${existing.code ? ` (${existing.code})` : ''}. A referral code can only be added once.`,
      'ALREADY_REFERRED',
    );
  }
  const referrer = await resolveReferrer(code, user);

  // Set it only if no code was added in the meantime (two taps, two phones)
  const updated = await User.findOneAndUpdate(
    { _id: user._id, referredBy: trusted({ $exists: false }) },
    { referredBy: referrer._id, referredAt: new Date(), referralStatus: 'pending' },
    { returnDocument: 'after' },
  );
  if (!updated) {
    const fresh = await User.findById(user._id);
    return applyReferralCode(fresh, code); // throws ALREADY_REFERRED with the right name
  }
  const paid = await payReferral(updated);
  return { user: updated, referredBy: await referrerSummary(updated), welcomeBonus: paid?.welcome || 0 };
}

/** The referral screen: own code, totals, who used the code, and whose code the member joined with. */
export async function getReferralInfo(user) {
  const friends = await User.find({ referredBy: user._id }).sort({ referredAt: -1, createdAt: -1 }).limit(200);
  const [earned, paidRows, live, referredBy] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: user._id, category: 'referral', refKey: { $regex: '^referral:' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // What was actually paid per friend (amounts change with halving)
    Transaction.find({
      user: user._id,
      category: 'referral',
      refKey: trusted({ $in: friends.map(f => `referral:${f._id}`) }),
    })
      .select('refKey amount')
      .lean(),
    liveRewards(),
    referrerSummary(user),
  ]);
  const paidFor = new Map(paidRows.map(t => [t.refKey, t.amount]));

  const list = friends.map(f => {
    const reward = paidFor.get(`referral:${f._id}`) || 0;
    const status = reward > 0 ? 'Rewarded' : f.referralStatus === 'capped' ? 'Expired' : 'Pending';
    const joined = (f.referredAt || f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return {
      id: f._id.toString(),
      name: f.name,
      avatar: f.avatar || null,
      status,
      note: status === 'Expired' ? `Joined ${joined} · monthly limit reached` : `Joined ${joined}`,
      reward,
      joinedAt: f.referredAt || f.createdAt,
    };
  });

  return {
    code: user.referralCode,
    rules: { ...REFERRAL_RULES, ...live },
    referredBy,
    canAddCode: !referredBy,
    stats: {
      invited: friends.length,
      rewarded: list.filter(f => f.status === 'Rewarded').length,
      earned: earned[0]?.total || 0,
    },
    referrals: list,
  };
}
