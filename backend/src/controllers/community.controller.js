import { getLeaderboard } from '../services/leaderboard.service.js';
import { evaluateBadges } from '../services/badge.service.js';
import { getReferralInfo } from '../services/referral.service.js';
import { getStats } from '../services/stats.service.js';

/** GET /leaderboard?period=weekly|monthly|all */
export async function leaderboard(req, res) {
  const { period, limit } = req.validatedQuery;
  const data = await getLeaderboard({ period, limit, tzOffset: req.tzOffset, userId: req.user._id });
  res.json({ success: true, data });
}

/** GET /badges */
export async function badges(req, res) {
  const list = await evaluateBadges(req.user);
  res.json({
    success: true,
    data: { badges: list, earned: list.filter(b => b.earned).length, total: list.length },
  });
}

/** GET /referrals */
export async function referrals(req, res) {
  res.json({ success: true, data: await getReferralInfo(req.user) });
}

/** GET /users/me/stats */
export async function stats(req, res) {
  res.json({ success: true, data: { stats: await getStats(req.user, req.tzOffset) } });
}
