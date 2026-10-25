import { STEP_RULES } from './rewards.js';

/**
 * Every habit the app tracks, with its goal and reward rule.
 * `kind` decides how values are logged:
 *  - steps:   uploaded from the phone's step counter (see steps.service.js)
 *  - counter: each log adds 1 (water glasses)
 *  - session: timed on the server — start, then finish (reading, breathing, cycling)
 *  - daily:   one value per day, latest wins (sleep hours)
 */
export const ACTIVITIES = {
  walk: {
    id: 'walk',
    name: 'Walking',
    kind: 'steps',
    unit: 'steps',
    goal: STEP_RULES.defaultGoal,
    rate: `${STEP_RULES.fitPerThousand} FIT / 1k steps`,
    maxReward: STEP_RULES.fitPerThousand * STEP_RULES.maxMilestones,
    verified: 'Phone step sensor',
    reward: steps => Math.min(STEP_RULES.maxMilestones, Math.floor(steps / 1000)) * STEP_RULES.fitPerThousand,
  },
  cycle: {
    id: 'cycle',
    name: 'Cycling',
    kind: 'session',
    unit: 'km',
    goal: 15,
    rate: '5 FIT / km',
    maxReward: 75,
    verified: 'Timed ride',
    // A ride can't be faster than this on average
    maxSpeedKmh: 45,
    maxSessionMinutes: 600,
    reward: km => Math.min(75, Math.floor(km) * 5),
  },
  water: {
    id: 'water',
    name: 'Hydration',
    kind: 'counter',
    unit: 'glasses',
    goal: 8,
    rate: '3 FIT / glass',
    maxReward: 24,
    verified: 'Manual log',
    maxPerDay: 16,
    // Logging faster than this is ignored (stops tap-spamming)
    minMinutesBetween: 10,
    reward: glasses => Math.min(24, glasses * 3),
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    kind: 'daily',
    unit: 'hours',
    goal: 8,
    rate: '40 FIT / goal met',
    maxReward: 40,
    verified: 'Manual log',
    maxValue: 14,
    reward: hours => (hours >= 8 ? 40 : 0),
  },
  read: {
    id: 'read',
    name: 'Reading',
    kind: 'session',
    unit: 'min',
    goal: 30,
    rate: '1 FIT / min',
    maxReward: 30,
    verified: 'Timer',
    maxSessionMinutes: 180,
    reward: minutes => Math.min(30, Math.floor(minutes)),
  },
  breathe: {
    id: 'breathe',
    name: 'Breathing',
    kind: 'session',
    unit: 'min',
    goal: 10,
    rate: '2 FIT / min',
    maxReward: 20,
    verified: 'Guided session',
    maxSessionMinutes: 60,
    reward: minutes => Math.min(20, Math.floor(minutes) * 2),
  },
};

export const ACTIVITY_IDS = Object.keys(ACTIVITIES);
export const LOGGABLE_IDS = ACTIVITY_IDS.filter(id => id !== 'walk');
export const SESSION_IDS = ACTIVITY_IDS.filter(id => ACTIVITIES[id].kind === 'session');
