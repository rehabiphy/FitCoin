import { Router } from 'express';
import * as community from '../controllers/community.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateQuery } from '../middlewares/validate.middleware.js';
import { leaderboardQuerySchema } from '../validators/engagement.validator.js';

/** Leaderboard, badges and referrals (mounted at the API root). */
const router = Router();

router.get('/leaderboard', requireAuth, validateQuery(leaderboardQuerySchema), community.leaderboard);
router.get('/badges', requireAuth, community.badges);
router.get('/referrals', requireAuth, community.referrals);

export default router;
