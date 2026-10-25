import { Router } from 'express';
import * as challenges from '../controllers/challenge.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateQuery } from '../middlewares/validate.middleware.js';
import { validateParam } from '../middlewares/params.middleware.js';
import { challengesQuerySchema, idParam } from '../validators/engagement.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(challengesQuerySchema), challenges.list);
router.get('/:id', validateParam('id', idParam), challenges.detail);
router.post('/:id/join', validateParam('id', idParam), challenges.join);

export default router;
