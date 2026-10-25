import Challenge from '../models/Challenge.js';
import Reward from '../models/Reward.js';
import { CHALLENGES } from './challenges.js';
import { MARKET_REWARDS } from './rewards.js';

/**
 * Makes sure the built-in challenges and marketplace items exist. Runs on every
 * start: definitions are updated from code, but remaining stock is never reset.
 */
export async function ensureSeedData() {
  await Promise.all([
    ...CHALLENGES.map(c => Challenge.updateOne({ slug: c.slug }, { $set: c }, { upsert: true })),
    ...MARKET_REWARDS.map(({ stock, ...r }) =>
      Reward.updateOne({ slug: r.slug }, { $set: r, $setOnInsert: { stock } }, { upsert: true }),
    ),
  ]);
}
