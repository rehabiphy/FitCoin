// Same live API the app's release build uses
export const LIVE_API_URL = 'https://fitcoin-7jq7.onrender.com/api/v1';

// `npm run dev` / `dev:live`: same-origin /api/v1, forwarded by Vite to the local or live backend.
// `npm run build`: the live API (override with VITE_API_URL).
const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? LIVE_API_URL : '/api/v1');
export const API_LABEL = import.meta.env.VITE_API_LABEL || (import.meta.env.PROD || import.meta.env.MODE === 'live' ? 'Live' : 'Local');
const STORE = 'fitcoin.admin.session';

export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = 'Something went wrong', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/* ---------- session ---------- */

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || null;
  } catch {
    return null;
  }
}

let session = readSession(); // { accessToken, refreshToken, user }
let onExpired = () => {};

export const getSession = () => session;
export const setExpiredHandler = fn => {
  onExpired = fn;
};

function saveSession(next) {
  session = next ? { ...(session || {}), ...next } : null;
  try {
    if (session) {
      localStorage.setItem(STORE, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORE);
    }
  } catch {
    // storage blocked: the session just won't survive a reload
  }
}

/* ---------- requests ---------- */

async function raw(method, path, { body, token } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError({ code: 'NETWORK_ERROR', message: 'Can’t reach the Fitcoin API. Is the backend running?' });
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    // empty body
  }
  if (!res.ok || json?.success === false) {
    throw new ApiError({
      status: res.status,
      code: json?.error?.code || `HTTP_${res.status}`,
      message: json?.error?.message || `Request failed (${res.status})`,
      details: json?.error?.details,
    });
  }
  return json?.data ?? json;
}

let refreshing = null;
function refresh() {
  if (!refreshing) {
    refreshing = raw('POST', '/auth/refresh', { body: { refreshToken: session?.refreshToken } })
      .then(({ tokens }) => {
        saveSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
        return tokens.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

async function request(method, path, body) {
  try {
    return await raw(method, path, { body, token: session?.accessToken });
  } catch (err) {
    if (err.status !== 401 || !session?.refreshToken) {
      throw err;
    }
  }
  let token;
  try {
    token = await refresh();
  } catch (err) {
    if (err.status === 401) {
      saveSession(null);
      onExpired();
    }
    throw err;
  }
  return raw(method, path, { body, token });
}

/* ---------- endpoints ---------- */

export async function login(email, password) {
  const { user, tokens } = await raw('POST', '/auth/login', { body: { email, password } });
  if (user.role !== 'admin') {
    // Don't keep a session the panel can't use
    raw('POST', '/auth/logout', { body: { refreshToken: tokens.refreshToken } }).catch(() => {});
    throw new ApiError({ status: 403, code: 'NOT_ADMIN', message: 'This account doesn’t have admin access.' });
  }
  saveSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
  return user;
}

export function logout() {
  const refreshToken = session?.refreshToken;
  saveSession(null);
  if (refreshToken) {
    raw('POST', '/auth/logout', { body: { refreshToken } }).catch(() => {});
  }
}

export const api = {
  me: () => request('GET', '/auth/me'),
  overview: () => request('GET', '/admin/overview'),
  config: () => request('GET', '/admin/config'),
  saveConfig: config => request('PUT', '/admin/config', config),
  users: ({ q = '', premium = 'all', page = 1, limit = 20 } = {}) =>
    request('GET', `/admin/users?${new URLSearchParams({ q, premium, page, limit })}`),
  grantPremium: (id, days) => request('POST', `/admin/users/${id}/premium`, { days }),
  revokePremium: id => request('DELETE', `/admin/users/${id}/premium`),
};
