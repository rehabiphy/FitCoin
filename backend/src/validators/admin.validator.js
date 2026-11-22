import { z } from 'zod';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { CHALLENGE_ICONS, GOAL_TYPES, GOAL_TYPE_IDS, PERIODS } from '../config/challenges.js';
import { daysBetween } from '../utils/dates.js';
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

// Screens an announcement can open when tapped (must exist in the app's navigator)
export const ANNOUNCEMENT_ROUTES = ['Notifications', 'Home', 'Activity', 'Challenges', 'Wallet', 'Marketplace', 'Premium', 'Referral', 'Leaderboard'];

export const announcementSchema = z.object({
  title: z.string({ error: 'Title is required' }).trim().min(3, { error: 'Title is too short' }).max(80),
  body: z.string({ error: 'Message is required' }).trim().min(5, { error: 'Message is too short' }).max(300),
  audience: z.enum(['all', 'premium', 'free']).default('all'),
  route: z.enum(ANNOUNCEMENT_ROUTES).default('Notifications'),
});

// The era the admin was looking at, so a halving can't be applied twice by accident
export const halvingStepSchema = z.object({
  fromEra: z.number().int().min(0),
});

export const halvingSettingsSchema = z.object({
  fromEra: z.number().int().min(0),
  // Fixed FIT amounts that ignore halving, by reward key (e.g. "habit.walk.perUnit", "streak.bonus")
  overrides: z
    .record(z.string().regex(/^[a-z]+(\.[a-z0-9-]+){1,2}$/i).max(80), coins(100000))
    .refine(o => Object.keys(o).length <= 200, { error: 'Too many fixed amounts' }),
  // Halve automatically once this many members have joined (null = off)
  autoAtUsers: z.number().int().min(1).max(1000000000).nullable(),
});

/* ---------- challenges ---------- */

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Pick a date' });
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: 'Use a colour like #7C5CFF' });
const runDays = c => (c.period === 'daily' ? 1 : c.period === 'weekly' ? 7 : daysBetween(c.startDate, c.endDate) + 1);

export const challengeSchema = z
  .object({
    title: z.string({ error: 'Title is required' }).trim().min(3, { error: 'Title is too short' }).max(60),
    description: z.string({ error: 'Description is required' }).trim().min(5, { error: 'Description is too short' }).max(200),
    period: z.enum(PERIODS),
    startDate: dateKey.optional(),
    endDate: dateKey.optional(),
    icon: z.enum(CHALLENGE_ICONS, { error: 'Pick an icon' }),
    gradient: z.array(hexColor).length(2),
    activity: z.enum(ACTIVITY_IDS, { error: 'Pick a habit' }),
    goalType: z.enum(GOAL_TYPE_IDS),
    dailyTarget: z.number({ error: 'Enter a daily amount' }).positive({ error: 'Daily amount must be above 0' }).max(100000).optional(),
    // Minute of the day a session must start before (e.g. 540 = 9 AM); empty = any time
    startBefore: z.number().int().min(1).max(1440).nullable().optional(),
    target: z.number({ error: 'Enter a target' }).positive({ error: 'Target must be above 0' }).max(10000000),
    unitLabel: z.string().trim().max(20).default(''),
    reward: coins(100000),
    active: z.boolean().default(true),
    sort: z.number().int().min(0).max(100000).optional(),
  })
  .superRefine((c, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (!GOAL_TYPES[c.goalType].activities.includes(c.activity)) {
      issue('goalType', `${ACTIVITIES[c.activity].name} has no timed sessions — pick another goal`);
    }
    if (c.period === 'custom') {
      if (!c.startDate || !c.endDate) {
        issue('startDate', 'An event needs a start and an end date');
        return;
      }
      if (c.endDate < c.startDate) {
        issue('endDate', 'The end date is before the start date');
        return;
      }
      if (runDays(c) > 366) {
        issue('endDate', 'An event can last at most a year');
      }
    }
    if (c.goalType === 'days') {
      if (!c.dailyTarget) {
        issue('dailyTarget', 'Enter the amount needed each day');
      }
      if (!Number.isInteger(c.target)) {
        issue('target', 'Days must be a whole number');
      } else if (c.target > runDays(c)) {
        issue('target', `This run only has ${runDays(c)} day${runDays(c) === 1 ? '' : 's'}`);
      }
    }
  });

export const challengeStatusSchema = z
  .object({ active: z.boolean().optional(), archived: z.boolean().optional() })
  .refine(s => s.active !== undefined || s.archived !== undefined, { error: 'Nothing to update' });

export const objectIdParam = z.string().regex(/^[a-f0-9]{24}$/i, { error: 'Challenge not found' });
