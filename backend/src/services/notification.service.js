import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { sendToUser } from './push.service.js';

// Push settings category for each in-app notification type (see push.service.js)
const PUSH_CATEGORY = {
  reward: 'rewards',
  streak: 'rewards',
  challenge: 'rewards',
  badge: 'rewards',
  redemption: 'rewards',
  referral: 'rewards',
  system: 'important',
};

// Screen the app opens when the push is tapped
const DEFAULT_ROUTE = {
  reward: 'Wallet',
  streak: 'Home',
  challenge: 'Challenges',
  badge: 'Badges',
  redemption: 'Wallet',
  referral: 'Referral',
  system: 'Notifications',
};

/**
 * Creates an in-app notification and pushes it to the user's phones.
 * `dedupeKey` makes it idempotent, so the same event (e.g. "step goal reached on 2026-10-25")
 * never notifies twice. Pass `push: false` to keep it in the app only.
 */
export async function notify(
  userId,
  { type = 'system', title, body, icon = 'Bell', color = 'primary', dedupeKey, push = true, route, params },
) {
  let doc;
  try {
    doc = await Notification.create({ user: userId, type, title, body, icon, color, dedupeKey });
  } catch (err) {
    if (err?.code === 11000) {
      return null;
    }
    throw err;
  }
  if (push) {
    // Don't make the request wait on FCM
    sendToUser(userId, {
      title,
      body,
      category: PUSH_CATEGORY[type] || 'important',
      data: { notificationId: doc._id.toString(), type, route: route || DEFAULT_ROUTE[type] || 'Notifications', params },
    }).catch(err => console.error('Push failed:', err.message));
  }
  return doc;
}

export async function listNotifications(userId, { limit = 50 } = {}) {
  const [items, unread] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ user: userId, read: false }),
  ]);
  return { items: items.map(n => n.toPublicJSON()), unread };
}

export const unreadCount = userId => Notification.countDocuments({ user: userId, read: false });

export async function markRead(userId, id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  return Notification.findOneAndUpdate({ _id: id, user: userId }, { read: true }, { returnDocument: 'after' });
}

export const markAllRead = userId => Notification.updateMany({ user: userId, read: false }, { read: true });

export async function removeNotification(userId, id) {
  if (!mongoose.isValidObjectId(id)) {
    return false;
  }
  const res = await Notification.deleteOne({ _id: id, user: userId });
  return res.deletedCount > 0;
}
