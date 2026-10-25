import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as market from '../controllers/marketplace.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateQuery } from '../middlewares/validate.middleware.js';
import { validateParam } from '../middlewares/params.middleware.js';
import { idParam, marketQuerySchema } from '../validators/engagement.validator.js';

const router = Router();

const redeemLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: req => req.user._id.toString(),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many redemptions, try again shortly' } }),
});

router.use(requireAuth);

router.get('/categories', market.categories);
router.get('/rewards', validateQuery(marketQuerySchema), market.list);
router.get('/rewards/:id', validateParam('id', idParam), market.detail);
router.post('/rewards/:id/redeem', redeemLimiter, validateParam('id', idParam), market.redeem);
router.get('/redemptions', market.redemptions);

export default router;
