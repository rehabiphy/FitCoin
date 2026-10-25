/**
 * Badge rules. `metric` names a number computed in badge.service.js;
 * the badge is earned once that number reaches `target`.
 */
export const BADGES = [
  { id: 'first_steps', name: 'First Steps', icon: 'Footprints', color: 'mint', desc: 'Complete your first activity', metric: 'activeDays', target: 1 },
  { id: 'on_fire', name: 'On Fire', icon: 'Flame', color: 'orange', desc: '7-day streak', metric: 'bestStreak', target: 7 },
  { id: 'hydrated', name: 'Hydrated', icon: 'Droplet', color: 'blue', desc: 'Meet water goal 10 times', metric: 'waterGoalDays', target: 10 },
  { id: 'night_owl', name: 'Night Owl', icon: 'Moon', color: 'primary', desc: 'Log 50 nights of sleep', metric: 'sleepLogs', target: 50 },
  { id: 'road_warrior', name: 'Road Warrior', icon: 'Bike', color: 'cyan', desc: 'Cycle 500 km total', metric: 'cycleKm', target: 500 },
  { id: 'zen_master', name: 'Zen Master', icon: 'Wind', color: 'pink', desc: '100 breathing sessions', metric: 'breatheSessions', target: 100 },
  { id: 'champion', name: 'Champion', icon: 'Crown', color: 'gold', desc: 'Finish top 10 weekly', metric: 'weeklyTop10', target: 1 },
  { id: 'connector', name: 'Connector', icon: 'Users', color: 'mint', desc: 'Refer 3 friends', metric: 'rewardedReferrals', target: 3 },
];
