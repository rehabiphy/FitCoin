/** Levels, streak bonus and referral rules. XP = lifetime FIT earned. */

const LEVEL_NAMES = [
  'Starter',
  'Mover',
  'Walker',
  'Jogger',
  'Runner',
  'Athlete',
  'Pathfinder',
  'Trailblazer',
  'Achiever',
  'Champion',
  'Legend',
];

/** XP needed to reach `level` (level 1 = 0, 2 = 100, 3 = 300, 4 = 600 …). */
export const xpForLevel = level => 50 * level * (level - 1);

export function levelFromXp(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) {
    level += 1;
  }
  return {
    level,
    levelName: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    xp: Math.floor(xp),
    xpLevelStart: xpForLevel(level),
    xpNext: xpForLevel(level + 1),
  };
}

export const STREAK_RULES = {
  // Every 7th consecutive active day (7, 14, 21 …) pays a bonus
  bonusEvery: 7,
  bonusAmount: 50,
};

export const REFERRAL_RULES = {
  referrerReward: 100,
  refereeReward: 50,
  activeDaysRequired: 3,
  maxRewardedPerMonth: 20,
};

export const MARKETPLACE_RULES = {
  feeRate: 0.02,
  // Display only: what 1 FIT is worth in partner value
  inrPerFit: 0.5,
};

export const EXPIRY_RULES = {
  months: 6,
  warnDays: 14,
};
