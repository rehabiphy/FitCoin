import { Linking, NativeModules, Platform } from 'react-native';
import { WEB_URL } from '../config';

/**
 * Invite codes that reach the app from outside:
 *  - an invite link opened with the app installed (https App Link or axyio://invite/<code>)
 *  - the Play install referrer, when the app was installed from an invite page's Play link
 *
 * The latest code is kept as the "pending" code; the sign-up form, the referral
 * prompt and the Refer & Earn screen fill it in. Nothing is applied automatically.
 */

const CODE_RE = /^[A-Za-z0-9-]{3,32}$/;
// Invite links from the current website, plus the old URL so links shared before the move still work
const HOSTS = [WEB_URL.replace(/^https?:\/\//, '').replace(/\/+$/, ''), 'fit-coin-lszq.vercel.app'].map(h => h.toLowerCase());

let pending = null; // { code, source: 'link' | 'install' }
const listeners = new Set();

const normalize = code => (code && CODE_RE.test(code) ? code.toUpperCase() : null);

/** The code in an invite URL, or null for any other URL. */
export function codeFromUrl(url) {
  if (!url) {
    return null;
  }
  const https = url.match(/^https?:\/\/([^/?#]+)\/invite\/([^/?#]+)/i);
  if (https && HOSTS.includes(https[1].toLowerCase())) {
    return normalize(decodeURIComponent(https[2]));
  }
  const custom = url.match(/^axyio:\/\/invite\/([^/?#]+)/i);
  return custom ? normalize(decodeURIComponent(custom[1])) : null;
}

/** "invite_code=AXYIO-AISHA21&utm_source=..." -> "AXYIO-AISHA21" */
function codeFromReferrer(referrer) {
  if (!referrer) {
    return null;
  }
  for (const part of String(referrer).split('&')) {
    const [key, value = ''] = part.split('=');
    if (key === 'invite_code') {
      try {
        return normalize(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function setPending(code, source) {
  if (!code) {
    return;
  }
  // A link the person just tapped wins over the (older) install referrer
  if (pending && pending.source === 'link' && source === 'install') {
    return;
  }
  pending = { code, source };
  listeners.forEach(fn => fn(pending));
}

export const getPendingInvite = () => pending;

export function clearPendingInvite() {
  pending = null;
  listeners.forEach(fn => fn(null));
}

/** Calls `fn({ code, source })` whenever a new invite code arrives. Returns an unsubscribe function. */
export function onInvite(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let started = false;

/** Starts listening for invite links and reads the install referrer once. Call once at startup. */
export function startInviteLinks() {
  if (started) {
    return;
  }
  started = true;
  Linking.getInitialURL()
    .then(url => setPending(codeFromUrl(url), 'link'))
    .catch(() => {});
  Linking.addEventListener('url', ({ url }) => setPending(codeFromUrl(url), 'link'));

  const Native = Platform.OS === 'android' ? NativeModules.AxyioInstallReferrer : null;
  Native?.getReferrer()
    .then(referrer => setPending(codeFromReferrer(referrer), 'install'))
    .catch(() => {});
}
