import { z } from 'zod';
import { STEP_RULES } from '../config/rewards.js';

// Minutes east of UTC on the phone (IST = 330). Real offsets run from -12h to +14h.
// Optional: falls back to the X-Tz-Offset header / the user's last known offset (req.tzOffset).
export const tzOffset = z.coerce.number().int().min(-720).max(840).optional();

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Date must be YYYY-MM-DD' });

export const syncStepsSchema = z.object({
  tzOffset,
  source: z.enum(['android_sensor', 'ios_pedometer', 'health', 'manual']).default('android_sensor'),
  days: z
    .array(
      z.object({
        date: dateKey,
        steps: z.number().int().min(0).max(STEP_RULES.maxDailySteps * 2),
      }),
    )
    .min(1, { error: 'No step data sent' })
    .max(STEP_RULES.maxBackfillDays + 1)
    .refine(days => new Set(days.map(d => d.date)).size === days.length, { error: 'Duplicate dates' }),
});

export const stepsQuerySchema = z.object({
  tzOffset,
  days: z.coerce.number().int().min(1).max(31).default(7),
});
