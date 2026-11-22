import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate, validateQuery } from '../middlewares/validate.middleware.js';
import { validateParam } from '../middlewares/params.middleware.js';
import { idParam } from '../validators/engagement.validator.js';
import {
  announcementSchema,
  challengeSchema,
  challengeStatusSchema,
  objectIdParam,
  grantPremiumSchema,
  halvingSettingsSchema,
  halvingStepSchema,
  rewardConfigSchema,
  usersQuerySchema,
} from '../validators/admin.validator.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/overview', admin.overview);
router.get('/config', admin.getConfig);
router.put('/config', validate(rewardConfigSchema), admin.updateConfig);
router.get('/halving', admin.getHalving);
router.put('/halving', validate(halvingSettingsSchema), admin.updateHalving);
router.post('/halving/halve', validate(halvingStepSchema), admin.halveNow);
router.post('/halving/undo', validate(halvingStepSchema), admin.undoHalve);
router.get('/users', validateQuery(usersQuerySchema), admin.users);
router.post('/users/:id/premium', validateParam('id', idParam), validate(grantPremiumSchema), admin.grant);
router.delete('/users/:id/premium', validateParam('id', idParam), admin.revoke);
router.get('/challenges', admin.challenges);
router.post('/challenges', validate(challengeSchema), admin.createChallenge);
router.put('/challenges/:id', validateParam('id', objectIdParam), validate(challengeSchema), admin.updateChallenge);
router.patch('/challenges/:id/status', validateParam('id', objectIdParam), validate(challengeStatusSchema), admin.setChallengeStatus);
router.get('/notifications', admin.notificationsInfo);
router.post('/notifications', validate(announcementSchema), admin.sendAnnouncement);

export default router;
