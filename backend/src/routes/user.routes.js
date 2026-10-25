import { Router } from 'express';
import * as users from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { changePasswordSchema, updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/me', users.getProfile);
router.patch('/me', validate(updateProfileSchema), users.updateProfile);
router.patch('/me/password', authLimiter, validate(changePasswordSchema), users.changePassword);

export default router;
