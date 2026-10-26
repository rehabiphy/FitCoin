import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate, validateQuery } from '../middlewares/validate.middleware.js';
import { validateParam } from '../middlewares/params.middleware.js';
import { idParam } from '../validators/engagement.validator.js';
import { grantPremiumSchema, rewardConfigSchema, usersQuerySchema } from '../validators/admin.validator.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/overview', admin.overview);
router.get('/config', admin.getConfig);
router.put('/config', validate(rewardConfigSchema), admin.updateConfig);
router.get('/users', validateQuery(usersQuerySchema), admin.users);
router.post('/users/:id/premium', validateParam('id', idParam), validate(grantPremiumSchema), admin.grant);
router.delete('/users/:id/premium', validateParam('id', idParam), admin.revoke);

export default router;
