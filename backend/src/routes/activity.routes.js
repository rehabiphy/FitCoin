import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as activity from '../controllers/activity.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateParam } from '../middlewares/params.middleware.js';
import {
  activityIdParam,
  finishSessionSchema,
  idParam,
  sessionActivityParam,
  sleepLogSchema,
} from '../validators/engagement.validator.js';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: req => req.user._id.toString(),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Slow down a little' } }),
});

router.use(requireAuth);

router.get('/', activity.today);
router.post('/water/log', writeLimiter, activity.logWater);
router.post('/sleep/log', writeLimiter, validate(sleepLogSchema), activity.logSleep);
router.post('/sessions/:sessionId/finish', writeLimiter, validateParam('sessionId', idParam), validate(finishSessionSchema), activity.finishSession);
router.post('/sessions/:sessionId/cancel', writeLimiter, validateParam('sessionId', idParam), activity.cancelSession);
router.post('/:id/sessions', writeLimiter, validateParam('id', sessionActivityParam), activity.startSession);
router.get('/:id', validateParam('id', activityIdParam), activity.detail);

export default router;
