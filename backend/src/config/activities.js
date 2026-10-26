import { STEP_RULES } from './rewards.js';

/**
 * Every habit the app tracks. Names, units and anti-cheat limits live here.
 * Coin values (rate, daily max, goal) are only the *defaults*: the live values
 * are edited in the admin panel and read through rewardConfig.service.js.
 *
 * `kind` decides how values are logged:
 *  - steps:   uploaded from the phone's step counter (see steps.service.js)
 *  - counter: each log adds 1 (water glasses)
 *  - session: timed on the server — start, then finish (reading, breathing, cycling)
 *  - daily:   one value per day, latest wins (sleep hours)
 *
 * `rewardMode`:
 *  - perUnit: `perUnit` FIT for every full `unitSize` logged, up to `maxReward` a day
 *  - goal:    `maxReward` FIT once the day's value reaches `goal`
 */
export const ACTIVITIES = {
  walk: {
    id: 'walk',
    name: 'Walking',
    kind: 'steps',
    unit: 'steps',
    rateUnit: '1k steps',
    rewardMode: 'perUnit',
    unitSize: 1000,
    verified: 'Phone step sensor',
    defaults: { perUnit: STEP_RULES.fitPerThousand, maxReward: STEP_RULES.fitPerThousand * STEP_RULES.maxMilestones, goal: STEP_RULES.defaultGoal },
  },
  cycle: {
    id: 'cycle',
    name: 'Cycling',
    kind: 'session',
    unit: 'km',
    rateUnit: 'km',
    rewardMode: 'perUnit',
    unitSize: 1,
    verified: 'Timed ride',
    // A ride can't be faster than this on average
    maxSpeedKmh: 45,
    maxSessionMinutes: 600,
    defaults: { perUnit: 5, maxReward: 75, goal: 15 },
  },
  water: {
    id: 'water',
    name: 'Hydration',
    kind: 'counter',
    unit: 'glasses',
    rateUnit: 'glass',
    rewardMode: 'perUnit',
    unitSize: 1,
    verified: 'Manual log',
    maxPerDay: 16,
    // Logging faster than this is ignored (stops tap-spamming)
    minMinutesBetween: 10,
    defaults: { perUnit: 3, maxReward: 24, goal: 8 },
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    kind: 'daily',
    unit: 'hours',
    rateUnit: 'goal met',
    rewardMode: 'goal',
    unitSize: 1,
    verified: 'Manual log',
    maxValue: 14,
    defaults: { perUnit: 0, maxReward: 40, goal: 8 },
  },
  read: {
    id: 'read',
    name: 'Reading',
    kind: 'session',
    unit: 'min',
    rateUnit: 'min',
    rewardMode: 'perUnit',
    unitSize: 1,
    verified: 'Timer',
    maxSessionMinutes: 180,
    defaults: { perUnit: 1, maxReward: 30, goal: 30 },
  },
  breathe: {
    id: 'breathe',
    name: 'Breathing',
    kind: 'session',
    unit: 'min',
    rateUnit: 'min',
    rewardMode: 'perUnit',
    unitSize: 1,
    verified: 'Guided session',
    maxSessionMinutes: 60,
    defaults: { perUnit: 2, maxReward: 20, goal: 10 },
  },
};

export const ACTIVITY_IDS = Object.keys(ACTIVITIES);
export const LOGGABLE_IDS = ACTIVITY_IDS.filter(id => id !== 'walk');
export const SESSION_IDS = ACTIVITY_IDS.filter(id => ACTIVITIES[id].kind === 'session');
