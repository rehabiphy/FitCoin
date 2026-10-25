import { z } from 'zod';
import { ACTIVITY_IDS, SESSION_IDS } from '../config/activities.js';

export const activityIdParam = z.enum(ACTIVITY_IDS, { error: 'Unknown activity' });
export const sessionActivityParam = z.enum(SESSION_IDS, { error: 'This activity has no sessions' });

export const sleepLogSchema = z.object({
  hours: z.number({ error: 'Hours are required' }).min(0.5, { error: 'Log at least 30 minutes' }).max(14, { error: 'Up to 14 hours' }),
});

export const finishSessionSchema = z.object({
  // Distance in km for cycling, or minutes actually spent (≤ timed) for others
  value: z.number().min(0).max(1000).optional(),
});

export const leaderboardQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly', 'all']).default('weekly'),
  limit: z.coerce.number().int().min(3).max(100).default(50),
});

export const challengesQuerySchema = z.object({
  filter: z.enum(['all', 'daily', 'weekly', 'joined']).default('all'),
});

export const marketQuerySchema = z.object({
  category: z.string().trim().max(40).optional(),
  q: z.string().trim().max(60).optional(),
});

export const idParam = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, { error: 'Invalid id' });
