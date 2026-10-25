import { Router } from 'express';
import * as wallet from '../controllers/wallet.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateQuery } from '../middlewares/validate.middleware.js';
import { transactionsQuerySchema, walletQuerySchema } from '../validators/wallet.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', validateQuery(walletQuerySchema), wallet.summary);
router.get('/transactions', validateQuery(transactionsQuerySchema), wallet.transactions);
router.get('/transactions/:id', wallet.transaction);

export default router;
