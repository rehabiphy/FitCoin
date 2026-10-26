/**
 * Step sanity limits, plus the *default* coin values used until an admin changes
 * them. Live coin values come from rewardConfig.service.js (edited in the admin panel).
 */
export const STEP_RULES = {
  // Default FIT for every full 1,000 steps in a day
  fitPerThousand: 6,
  // Default: only the first 10 milestones (10,000 steps) earn FIT => max 60 FIT/day from steps
  maxMilestones: 10,
  defaultGoal: 10000,
  // Sanity limits used to reject impossible data
  maxDailySteps: 100000,
  // Faster than anyone walks or runs (same bound the phone's step ledger uses)
  maxStepsPerMinute: 250,
  // How many days back the app may upload (the phone keeps a 30-day ledger)
  maxBackfillDays: 7,
};

export const WALLET_RULES = {
  // Default daily cap on habit rewards for free users
  dailyCap: 300,
};

/**
 * Free members pick a few habits from each group to earn from (premium: all).
 * `freeLimit` is the default; admins change it in the panel.
 * `defaults` are active until a member picks their own.
 */
export const HABIT_GROUPS = {
  movement: { id: 'movement', name: 'Movement', ids: ['walk', 'cycle'], freeLimit: 1, defaults: ['walk'] },
  lifestyle: { id: 'lifestyle', name: 'Lifestyle', ids: ['water', 'sleep', 'read', 'breathe'], freeLimit: 2, defaults: ['water', 'sleep'] },
};

export const HABIT_GROUP_IDS = Object.keys(HABIT_GROUPS);

export const groupOf = habitId => HABIT_GROUP_IDS.find(g => HABIT_GROUPS[g].ids.includes(habitId));

/** Default premium plan, used until an admin changes it. */
export const PREMIUM_DEFAULTS = {
  enabled: true,
  title: 'Fitcoin Premium',
  tagline: 'Earn 2x FIT on every healthy habit',
  // Habit rewards are multiplied by this for premium members
  multiplier: 2,
  // Daily cap on habit rewards for premium members
  dailyCap: 600,
  price: 99,
  currency: 'INR',
  durationDays: 30,
  // Show the upgrade pop-up when the app opens for users who aren't premium
  showPopup: true,
  benefits: [
    'All 6 habits active — free members pick 1 movement + 2 lifestyle',
    '2x FIT on walking, cycling, water, sleep, reading and breathing',
    'Higher daily earning cap',
    'Premium badge on your profile',
  ],
};
