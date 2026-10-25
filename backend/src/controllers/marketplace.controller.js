import * as market from '../services/marketplace.service.js';

/** GET /marketplace/categories */
export function categories(req, res) {
  res.json({ success: true, data: { categories: market.categories() } });
}

/** GET /marketplace/rewards?category=Food&q=coffee */
export async function list(req, res) {
  const rewards = await market.listRewards(req.validatedQuery);
  res.json({ success: true, data: { rewards } });
}

/** GET /marketplace/rewards/:id */
export async function detail(req, res) {
  res.json({ success: true, data: { reward: await market.getReward(req.params.id) } });
}

/** POST /marketplace/rewards/:id/redeem */
export async function redeem(req, res) {
  const result = await market.redeem(req.user._id, req.params.id, req.tzOffset);
  res.status(201).json({ success: true, data: result });
}

/** GET /marketplace/redemptions */
export async function redemptions(req, res) {
  res.json({ success: true, data: { redemptions: await market.listRedemptions(req.user._id) } });
}
