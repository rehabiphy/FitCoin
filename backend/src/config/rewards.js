/**
 * Reward rules. Keep these in sync with the app's "Token & reward rules" screen.
 */
export const STEP_RULES = {
  // FIT credited for every full 1,000 steps in a day
  fitPerThousand: 6,
  // Only the first 10 milestones (10,000 steps) earn FIT => max 60 FIT/day from steps
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
  // Across all activities. Steps alone can earn at most 60, so this applies once more activities earn FIT.
  dailyCap: 300,
};
