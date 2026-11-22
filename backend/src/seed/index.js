import Challenge from '../models/Challenge.js';
import Reward from '../models/Reward.js';
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
 * Makes sure the built-in challenges and marketplace items exist. Runs on every
 * start. Challenges are only inserted when missing (the admin panel owns them
 * after that); marketplace definitions are updated from code, but remaining
 * stock is never reset.
 */
export async function ensureSeedData() {
  await migrateLegacyChallenges();
  await Promise.all([
    ...CHALLENGES.map(c => Challenge.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true })),
    ...MARKET_REWARDS.map(({ stock, ...r }) =>
      Reward.updateOne({ slug: r.slug }, { $set: r, $setOnInsert: { stock } }, { upsert: true }),
    ),
  ]);
}
