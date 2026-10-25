import { z } from 'zod';
import { tzOffset } from './steps.validator.js';

export const walletQuerySchema = z.object({ tzOffset });

export const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['earn', 'bonus', 'redeem', 'fee', 'expire']).optional(),
  group: z.enum(['earned', 'redeemed', 'other']).optional(),
});
