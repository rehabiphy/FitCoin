import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

/**
 * Creates an in-app notification. `dedupeKey` makes it idempotent, so the same
 * event (e.g. "step goal reached on 2026-10-25") never notifies twice.
 */
export async function notify(userId, { type = 'system', title, body, icon = 'Bell', color = 'primary', dedupeKey }) {
  try {
    return await Notification.create({ user: userId, type, title, body, icon, color, dedupeKey });
  } catch (err) {
    if (err?.code === 11000) {
      return null;
    }
    throw err;
  }
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
