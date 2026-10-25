import * as Keychain from 'react-native-keychain';

/**
 * Keeps the session in the iOS Keychain / Android Keystore (encrypted at rest),
 * never in plain AsyncStorage. A memory copy avoids hitting native storage on every request.
 */
const SERVICE = 'app.fitcoin.session';

let cache = null; // { accessToken, refreshToken, user }

export async function loadSession() {
  if (cache) {
    return cache;
  }
  try {
    const creds = await Keychain.getGenericPassword({ service: SERVICE });
    cache = creds ? JSON.parse(creds.password) : null;
  } catch {
    cache = null;
  }
  return cache;
}

export async function saveSession(patch) {
  cache = { ...(cache || {}), ...patch };
  await Keychain.setGenericPassword('session', JSON.stringify(cache), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return cache;
}

export async function clearSession() {
  cache = null;
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // nothing stored
  }
}

export const getAccessToken = () => cache?.accessToken || null;
export const getRefreshToken = () => cache?.refreshToken || null;
