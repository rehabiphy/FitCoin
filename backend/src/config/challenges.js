import { ACTIVITIES, ACTIVITY_IDS, SESSION_IDS } from './activities.js';

/**
 * How a challenge measures progress. Every challenge tracks one habit
 * (`activity`, see activities.js) over its run, counted one of these ways:
 *
 *  - total:   everything logged during the run       ("Cycle 50 km this week")
 *  - days:    days reaching `dailyTarget`             ("10,000 steps on 7 days")
 *  - session: the best single timed session, optionally
 *             started before `startBefore` (minute of day) ("5 min breathing before 9 AM")
 *
 * `target` is the number to reach: units for total/session, days for days.
 */
export const GOAL_TYPES = {
  total: { id: 'total', name: 'Total amount', activities: ACTIVITY_IDS },
  days: { id: 'days', name: 'Days hitting a daily amount', activities: ACTIVITY_IDS },
  session: { id: 'session', name: 'One timed session', activities: SESSION_IDS },
};

export const GOAL_TYPE_IDS = Object.keys(GOAL_TYPES);

/**
 * daily / weekly repeat (weeks run Mon–Sun in the member's local time);
 * custom runs once, from `startDate` to `endDate` inclusive.
 */
export const PERIODS = ['daily', 'weekly', 'custom'];

export const periodLabel = period => ({ daily: 'Daily', weekly: 'Weekly', custom: 'Event' })[period] || 'Challenge';

// Icons the admin can pick (lucide names, rendered by the app's <Icon>)
export const CHALLENGE_ICONS = [
  'Footprints', 'Droplet', 'Bike', 'Wind', 'BookOpen', 'Moon', 'Flame', 'Trophy', 'Target', 'Zap',
  'Heart', 'Mountain', 'Sun', 'Timer', 'Star', 'Medal', 'Dumbbell', 'Leaf', 'Coffee', 'Sparkles',
];

/** Short unit for a challenge's progress label when the admin leaves it blank. */
export const defaultUnitLabel = (goalType, activity) => (goalType === 'days' ? 'days' : ACTIVITIES[activity]?.unit || '');

/**
 * The fixed metrics challenges used before they were editable, mapped to goals.
 * Used once to migrate existing documents (see seed/index.js).
 */
export const LEGACY_METRICS = {
  stepGoalDays: { activity: 'walk', goalType: 'days', dailyTarget: 10000 },
  waterGlasses: { activity: 'water', goalType: 'total' },
  cycleKm: { activity: 'cycle', goalType: 'total' },
  readGoalDays: { activity: 'read', goalType: 'days', dailyTarget: 30 },
  morningBreatheMinutes: { activity: 'breathe', goalType: 'session', startBefore: 9 * 60 },
};
