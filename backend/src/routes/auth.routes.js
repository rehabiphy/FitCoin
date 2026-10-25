import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { googleSchema, loginSchema, refreshSchema, registerSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/google', authLimiter, validate(googleSchema), auth.googleLogin);
router.post('/refresh', validate(refreshSchema), auth.refresh);
router.post('/logout', validate(refreshSchema), auth.logout);
router.post('/logout-all', requireAuth, auth.logoutAll);
router.get('/me', requireAuth, auth.me);

export default router;
