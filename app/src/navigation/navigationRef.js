import { createNavigationContainerRef } from '@react-navigation/native';

/** Lets code outside screens (push notification taps) navigate. */
export const navigationRef = createNavigationContainerRef();

// Screens that live inside the bottom tabs
const TAB_ROUTES = ['Home', 'Wallet', 'Challenges', 'Leaderboard', 'Profile'];

/** Parses the `params` a push carries (sent as a JSON string). */
function parseParams(raw) {
  if (!raw) {
    return undefined;
  }
  if (typeof raw === 'object') {
    return raw;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Opens the screen named in a push's data ({ route, params }). Returns false if it couldn't. */
export function openRoute(route, rawParams) {
  if (!navigationRef.isReady() || !route) {
    return false;
  }
  const params = parseParams(rawParams);
  const names = navigationRef.getRootState()?.routeNames || [];
  if (TAB_ROUTES.includes(route)) {
    navigationRef.navigate('Main', { screen: route, params });
    return true;
  }
  if (!names.includes(route)) {
    // Unknown screen (older app version) — the notification list is always a safe landing spot
    if (names.includes('Notifications')) {
      navigationRef.navigate('Notifications');
      return true;
    }
    return false;
  }
  navigationRef.navigate(route, params);
  return true;
}
