import { Router } from 'express';
import * as premium from '../controllers/premium.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', premium.info);
router.post('/upgrade', authLimiter, premium.upgrade);

export default router;
