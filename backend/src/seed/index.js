import Challenge from '../models/Challenge.js';
import Reward from '../models/Reward.js';
import User from '../models/User.js';
import AppSetting from '../models/AppSetting.js';
import { LEGACY_METRICS } from '../config/challenges.js';
import { CHALLENGES } from './challenges.js';
import { MARKET_REWARDS } from './rewards.js';

/**
 * Challenges saved before they were editable had a fixed `metric` name; give
 * those goal fields. Runs on every start but only touches documents without a goal.
 * `metric` is left in place so an older server on the same database keeps working.
 */
async function migrateLegacyChallenges() {
  const old = await Challenge.collection.find({ metric: { $exists: true }, activity: { $exists: false } }).toArray();
  await Promise.all(
    old.map(doc =>
      Challenge.collection.updateOne(
        { _id: doc._id },
        {
          $set: { ...(LEGACY_METRICS[doc.metric] || { activity: 'walk', goalType: 'total' }), archived: doc.archived ?? false },
        },
      ),
    ),
  );
}

/**
 * Referral codes used to start with "FIT-"; they now start with "AXYIO-". Renames
 * the old ones (FIT-PARTH34CE -> AXYIO-PARTH34CE). Runs on every start but only
 * touches codes that still have the old prefix. Old links keep working because
 * lookups read a FIT- code as its AXYIO- version (see normalizeCode).
 */
async function migrateLegacyReferralCodes() {
  const old = await User.collection.find({ referralCode: /^FIT-/ }).project({ referralCode: 1 }).toArray();
  for (const doc of old) {
    try {
      await User.collection.updateOne(
        { _id: doc._id, referralCode: doc.referralCode },
        { $set: { referralCode: doc.referralCode.replace(/^FIT-/, 'AXYIO-') } },
      );
    } catch (err) {
      // Another member already has that AXYIO- code; keep the old one (it still works)
      if (err?.code !== 11000) {
        throw err;
      }
    }
  }
}

/**
 * The reward unit was renamed from FIT to axyio. The Premium plan text saved from
 * the admin panel (title, tagline, benefits) still said FIT; this rewrites it.
 * Runs on every start but only writes when there is something to change.
 */
async function migrateLegacyTokenName() {
  const doc = await AppSetting.collection.findOne({ key: 'rewards' });
  const premium = doc?.value?.premium;
  if (!premium) {
    return;
  }
  const fix = text => (typeof text === 'string' ? text.replace(/\bFIT\b/g, 'axyio') : text);
  const set = {};
  for (const field of ['title', 'tagline']) {
    if (fix(premium[field]) !== premium[field]) {
      set[`value.premium.${field}`] = fix(premium[field]);
    }
  }
  if (Array.isArray(premium.benefits) && premium.benefits.some(b => fix(b) !== b)) {
    set['value.premium.benefits'] = premium.benefits.map(fix);
  }
  if (Object.keys(set).length) {
    await AppSetting.collection.updateOne({ _id: doc._id }, { $set: set });
  }
}

/**
 * Makes sure the built-in challenges and marketplace items exist. Runs on every
 * start. Challenges are only inserted when missing (the admin panel owns them
 * after that); marketplace definitions are updated from code, but remaining
 * stock is never reset.
 */
export async function ensureSeedData() {
  await migrateLegacyChallenges();
  await migrateLegacyReferralCodes();
  await migrateLegacyTokenName();
  await Promise.all([
    ...CHALLENGES.map(c => Challenge.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true })),
    ...MARKET_REWARDS.map(({ stock, ...r }) =>
      Reward.updateOne({ slug: r.slug }, { $set: r, $setOnInsert: { stock } }, { upsert: true }),
    ),
  ]);
}
