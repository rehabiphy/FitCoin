import { Platform } from 'react-native';

/**
 * Where the app finds the backend in development.
 * Android (phone or emulator): run `adb reverse tcp:5000 tcp:5000` so the device's
 * localhost:5000 reaches this computer. Without adb, use the computer's LAN IP instead.
 * Release builds block plain http, so production must be https.
 */
const DEV_API_URL = Platform.select({
  android: 'http://localhost:5000/api/v1',
  default: 'http://localhost:5000/api/v1',
});

const PROD_API_URL = 'https://fitcoin-7jq7.onrender.com/api/v1';

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const API_TIMEOUT_MS = 15000;

// The website. Invite links are WEB_URL/invite/<code>; Android opens them in the app
// (App Links, verified by web/public/.well-known/assetlinks.json).
export const WEB_URL = 'https://fit-coin-lszq.vercel.app';
export const inviteLink = code => `${WEB_URL}/invite/${encodeURIComponent(code)}`;

/**
 * The *Web application* OAuth client ID from Google Cloud Console
 * (APIs & Services → Credentials). Google signs the ID token for this client,
 * so the backend's GOOGLE_CLIENT_IDS must contain the same value.
 */
export const GOOGLE_WEB_CLIENT_ID = '768551395156-ldls2nu0ncp3j868f6tje7n1tf4t6nsl.apps.googleusercontent.com';

// Shows "Continue with Google" on the login screen.
export const GOOGLE_SIGN_IN_ENABLED = true;

// Marketplace (spending FIT on vouchers). Hidden for now: its screens aren't registered and every link to it is hidden.
export const MARKETPLACE_ENABLED = false;
