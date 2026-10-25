import { colors } from '../theme';

/** How each habit looks in the app. Numbers and rules come from the server. */
export const ACTIVITY_VISUALS = {
  walk: { icon: 'Footprints', color: colors.mint, gradient: ['#34F5B4', '#22D3EE'] },
  cycle: { icon: 'Bike', color: colors.cyan, gradient: ['#22D3EE', '#4D8DFF'] },
  water: { icon: 'Droplet', color: colors.blue, gradient: ['#4D8DFF', '#7C5CFF'] },
  sleep: { icon: 'Moon', color: colors.primary, gradient: ['#7C5CFF', '#FF5C9A'] },
  read: { icon: 'BookOpen', color: colors.gold, gradient: ['#FFD86B', '#FF8A3D'] },
  breathe: { icon: 'Wind', color: colors.pink, gradient: ['#FF5C9A', '#FF8A3D'] },
};

export const ACTIVITY_ORDER = ['walk', 'cycle', 'water', 'sleep', 'read', 'breathe'];

/** Server activity + visuals, ready for the existing UI components. */
export const withVisuals = a => ({ ...a, ...(ACTIVITY_VISUALS[a.id] || ACTIVITY_VISUALS.walk) });
