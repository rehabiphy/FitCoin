import mongoose from 'mongoose';
import DeviceToken from '../models/DeviceToken.js';
import PushLog from '../models/PushLog.js';
import User, { notificationPrefsOf } from '../models/User.js';
import { getFcm } from '../config/firebase.js';

const trusted = mongoose.trusted;

/**
 * Push notifications over FCM.
 *
 * Every push has a category, which decides whether the member's settings allow it
 * and which Android channel it lands in (channels are created by the app, see PushChannels.kt):
 *  - reminders: personalised habit and streak reminders          -> axyio_reminders
 *  - tips:      daily stay-healthy tips                           -> axyio_reminders
 *  - rewards:   rewards, badges, challenges, referrals, purchases -> axyio_updates
 *  - important: account and app announcements (ignore settings)   -> axyio_updates
 */
export const PUSH_CATEGORIES = ['reminders', 'tips', 'rewards', 'important'];

const CHANNEL = { reminders: 'axyio_reminders', tips: 'axyio_reminders', rewards: 'axyio_updates', important: 'axyio_updates' };

// FCM accepts up to 500 tokens per multicast
const BATCH = 500;

// Errors meaning the token will never work again, so it's deleted. ('invalid-argument' is
// left out on purpose: a bad payload causes it too, and that must not wipe good tokens.)
const DEAD_TOKEN_ERRORS = ['registration-token-not-registered', 'invalid-registration-token'];

const isDeadToken = error => DEAD_TOKEN_ERRORS.some(code => error?.code?.endsWith(code));

/** Saves (or moves) this phone's token to the signed-in user. */
export async function registerDevice(userId, { token, platform, appVersion }) {
  // A phone has one token; if another account used it before, it now belongs to this user
  await DeviceToken.findOneAndUpdate(
    { token },
    { $set: { user: userId, platform, appVersion, lastSeenAt: new Date() } },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

/** Removes one phone's token (sign-out). Limited to the owner when userId is given. */
export async function unregisterDevice(token, userId) {
  if (!token) {
    return;
  }
  await DeviceToken.deleteOne(userId ? { token, user: userId } : { token });
}

export const unregisterAllDevices = userId => DeviceToken.deleteMany({ user: userId });

/** FCM `data` values must be strings. */
function stringData(data = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
  );
}

function buildMessage({ title, body, category = 'important', data = {} }) {
  return {
    notification: { title, body },
    data: stringData({ ...data, category }),
    android: {
      priority: category === 'important' || category === 'rewards' ? 'high' : 'normal',
      notification: {
        channelId: CHANNEL[category] || CHANNEL.important,
        icon: 'ic_stat_axyio',
        color: '#7C5CFF',
        // A newer reminder of the same kind replaces the older one in the tray
        ...(data.tag ? { tag: String(data.tag) } : {}),
      },
    },
    apns: { payload: { aps: { sound: 'default' } } },
  };
}

/**
 * Sends one message to a list of tokens. Dead tokens are deleted.
 * Returns { sent, failed }. Never throws: push is best effort.
 */
export async function sendToTokens(tokens, payload) {
  const fcm = getFcm();
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!fcm || !unique.length) {
    return { sent: 0, failed: 0 };
  }

  const message = buildMessage(payload);
  let sent = 0;
  let failed = 0;
  const dead = [];

  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH);
    try {
      const res = await fcm.sendEachForMulticast({ ...message, tokens: chunk });
      sent += res.successCount;
      failed += res.failureCount;
      res.responses.forEach((r, idx) => {
        if (!r.success && isDeadToken(r.error)) {
          dead.push(chunk[idx]);
        }
      });
    } catch (err) {
      failed += chunk.length;
      console.error('FCM send failed:', err.message);
    }
  }

  if (dead.length) {
    await DeviceToken.deleteMany({ token: trusted({ $in: dead }) }).catch(() => {});
  }
  return { sent, failed };
}

/** Whether this member's settings allow a push of this category. */
export const allowsCategory = (user, category) => category === 'important' || notificationPrefsOf(user)[category] !== false;

/**
 * Pushes to every phone a user is signed in on, if their settings allow the category.
 * Pass `user` (with notificationPrefs) to skip the lookup.
 */
export async function sendToUser(userOrId, payload) {
  if (!getFcm()) {
    return { sent: 0, failed: 0 };
  }
  const isId = typeof userOrId === 'string' || userOrId instanceof mongoose.Types.ObjectId;
  const user = isId ? await User.findById(userOrId).select('notificationPrefs').lean() : userOrId;
  if (!user || !allowsCategory(user, payload.category)) {
    return { sent: 0, failed: 0 };
  }
  const tokens = await DeviceToken.distinct('token', { user: user._id });
  return sendToTokens(tokens, payload);
}

/**
 * Push-only message (reminders, tips) that must go out at most once per `key`:
 * the key is claimed first, so a second scheduler run or server skips it.
 */
export async function sendOnce(key, user, payload) {
  try {
    await PushLog.create({ key, user: user._id });
  } catch (err) {
    if (err?.code === 11000) {
      return false;
    }
    throw err;
  }
  await sendToUser(user, payload);
  return true;
}

export async function deviceStats() {
  const [devices, users] = await Promise.all([DeviceToken.countDocuments(), DeviceToken.distinct('user').then(u => u.length)]);
  return { devices, users, enabled: !!getFcm() };
}
