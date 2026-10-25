import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as steps from '../controllers/steps.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate, validateQuery } from '../middlewares/validate.middleware.js';
import { stepsQuerySchema, syncStepsSchema } from '../validators/steps.validator.js';

const router = Router();

// The app syncs about every 20 s while open; this leaves plenty of headroom per user
const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  keyGenerator: req => req.user._id.toString(),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Syncing too often' } }),
});

router.use(requireAuth);

router.post('/sync', syncLimiter, validate(syncStepsSchema), steps.sync);
router.get('/today', validateQuery(stepsQuerySchema), steps.today);
router.get('/history', validateQuery(stepsQuerySchema), steps.history);

export default router;
