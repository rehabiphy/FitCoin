import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import env from './env.js';

/**
 * Firebase Admin, used only for push notifications (FCM).
 * Credentials come from FIREBASE_SERVICE_ACCOUNT (JSON or base64 JSON) or
 * FIREBASE_SERVICE_ACCOUNT_PATH (the downloaded key file). Without them push is
 * off and everything else keeps working: in-app notifications are still saved.
 */

let messaging; // undefined = not tried yet, null = not configured

function readServiceAccount() {
  const { serviceAccount, serviceAccountPath } = env.firebase;
  if (serviceAccount) {
    const raw = serviceAccount.trim();
    return JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
  }
  if (serviceAccountPath) {
    return JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
  }
  return null;
}

/** The FCM client, or null when push isn't configured. */
export function getFcm() {
  if (messaging !== undefined) {
    return messaging;
  }
  try {
    const account = readServiceAccount();
    if (!account) {
      console.warn('Push notifications are off: set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH.');
      messaging = null;
      return messaging;
    }
    const app = getApps()[0] || initializeApp({ credential: cert(account), projectId: account.project_id });
    messaging = getMessaging(app);
    console.log(`Push notifications on (Firebase project ${account.project_id}).`);
  } catch (err) {
    console.error('Push notifications are off: could not read the Firebase service account:', err.message);
    messaging = null;
  }
  return messaging;
}
