import { Router } from 'express';
import * as community from '../controllers/community.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate, validateQuery } from '../middlewares/validate.middleware.js';
import { validateParam } from '../middlewares/params.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { applyReferralSchema, leaderboardQuerySchema, referralCodeParam } from '../validators/engagement.validator.js';

/** Leaderboard, badges and referrals (mounted at the API root). */
const router = Router();

router.get('/leaderboard', requireAuth, validateQuery(leaderboardQuerySchema), community.leaderboard);
router.get('/badges', requireAuth, community.badges);
router.get('/referrals', requireAuth, community.referrals);
// Wrong codes count toward the strict limit, so codes can't be guessed in bulk
router.post('/referrals/apply', requireAuth, authLimiter, validate(applyReferralSchema), community.applyReferral);
router.get('/referrals/code/:code', authLimiter, validateParam('code', referralCodeParam), community.referralCode);

export default router;
