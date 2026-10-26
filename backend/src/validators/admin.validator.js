import { z } from 'zod';
import { ACTIVITY_IDS } from '../config/activities.js';
import { HABIT_GROUPS, HABIT_GROUP_IDS } from '../config/rewards.js';

const coins = (max = 10000) => z.number({ error: 'Enter a number' }).min(0, { error: 'Can’t be negative' }).max(max);

const habitSchema = z.object({
  // FIT per unit (per 1,000 steps for walking); ignored for goal-based habits like sleep
  perUnit: coins(1000),
  // Most FIT this habit can earn in a day (or the goal reward for sleep)
  maxReward: coins(5000),
  goal: z.number({ error: 'Enter a goal' }).positive({ error: 'Goal must be above 0' }).max(100000),
});

export const rewardConfigSchema = z.object({
  dailyCap: coins(100000),
  // Habits a free member can pick from each group (0 = none from that group)
  freeHabitLimits: z
    .object(
      Object.fromEntries(
        HABIT_GROUP_IDS.map(g => [
          g,
          z
            .number({ error: 'Enter a number' })
            .int({ error: 'Whole number of habits' })
            .min(0)
            .max(HABIT_GROUPS[g].ids.length, { error: `${HABIT_GROUPS[g].name} has ${HABIT_GROUPS[g].ids.length} habits` }),
        ]),
      ),
    )
    .refine(l => Object.values(l).some(n => n > 0), { error: 'Free members need at least one habit' }),
  habits: z.object(Object.fromEntries(ACTIVITY_IDS.map(id => [id, habitSchema]))),
  premium: z.object({
    enabled: z.boolean(),
    title: z.string().trim().min(2).max(40),
    tagline: z.string().trim().max(120),
    multiplier: z.number().min(1, { error: 'Multiplier must be at least 1' }).max(10, { error: 'Multiplier can be at most 10' }),
    dailyCap: coins(100000),
    price: z.number().min(0).max(1000000),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, { error: 'Use a 3-letter currency code, e.g. INR' }),
    durationDays: z.number().int().min(1).max(3650),
    showPopup: z.boolean(),
    benefits: z.array(z.string().trim().min(1).max(120)).max(8),
  }),
});

export const usersQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  premium: z.enum(['all', 'premium', 'free']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const grantPremiumSchema = z.object({
  days: z.number().int().min(1).max(3650),
});
