import { API_BASE_URL, API_TIMEOUT_MS } from '../config';
import { clearSession, getAccessToken, getRefreshToken, saveSession } from '../services/tokenStorage';

/** Every failed request rejects with this, so screens can show `error.message` directly. */
export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = 'Something went wrong', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** { email: 'Enter a valid email', ... } from server validation errors */
  get fieldErrors() {
    return (this.details || []).reduce((acc, d) => {
      if (d.field && !acc[d.field]) {
        acc[d.field] = d.message;
      }
      return acc;
    }, {});
  }
}

let onSessionExpired = () => {};
/** AuthContext registers this so the app returns to Login when the refresh token is no longer valid. */
export const setSessionExpiredHandler = fn => {
  onSessionExpired = fn;
};

async function rawRequest(method, path, { body, token, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  signal?.addEventListener?.('abort', () => controller.abort());

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        // Lets the server work in the user's local day (IST = 330)
        'X-Tz-Offset': String(-new Date().getTimezoneOffset()),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = err?.name === 'AbortError' && !signal?.aborted;
    throw new ApiError({
      code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: timedOut
        ? 'The server took too long to respond. Please try again.'
        : 'Unable to reach Fitcoin servers. Check your internet connection.',
    });
  } finally {
    clearTimeout(timer);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok || json?.success === false) {
    throw new ApiError({
      status: res.status,
      code: json?.error?.code || `HTTP_${res.status}`,
      message: json?.error?.message || 'Something went wrong',
      details: json?.error?.details,
    });
  }
  return json?.data ?? json;
}

// Shared promise so many requests failing with 401 at once trigger only one refresh
let refreshing = null;

async function refreshTokens() {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new ApiError({ status: 401, code: 'NO_SESSION', message: 'Please sign in again.' });
      }
      const { tokens } = await rawRequest('POST', '/auth/refresh', { body: { refreshToken } });
      await saveSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return tokens.accessToken;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/**
 * @param {string} method
 * @param {string} path  e.g. '/auth/me'
 * @param {{ body?: any, auth?: boolean, signal?: AbortSignal }} options
 *   auth (default true) attaches the access token and refreshes it once if it has expired.
 */
export async function request(method, path, { body, auth = true, signal } = {}) {
  if (!auth) {
    return rawRequest(method, path, { body, signal });
  }

  try {
    return await rawRequest(method, path, { body, signal, token: getAccessToken() });
  } catch (err) {
    if (err.status !== 401) {
      throw err;
    }
  }

  let newToken;
  try {
    newToken = await refreshTokens();
  } catch (err) {
    // Only end the session when the server rejected the refresh token, not when offline
    if (err.status === 401) {
      await clearSession();
      onSessionExpired();
    }
    throw err;
  }
  return rawRequest(method, path, { body, signal, token: newToken });
}

const apiClient = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
};

export default apiClient;
