import ApiError from '../utils/ApiError.js';
import { notificationPrefsOf } from '../models/User.js';
import * as notifications from '../services/notification.service.js';
import { registerDevice, unregisterDevice } from '../services/push.service.js';

/** POST /notifications/devices — { token, platform, appVersion? }. Called after sign-in and on every launch. */
export async function addDevice(req, res) {
  await registerDevice(req.user._id, req.body);
  res.json({ success: true, data: { registered: true } });
}

/** DELETE /notifications/devices — { token }. Stops push to this phone. */
export async function removeDevice(req, res) {
  await unregisterDevice(req.body.token, req.user._id);
  res.json({ success: true, data: { removed: true } });
}

/** GET /notifications/preferences */
export async function getPrefs(req, res) {
  res.json({ success: true, data: { preferences: notificationPrefsOf(req.user) } });
}

/** PATCH /notifications/preferences — { reminders?, tips?, rewards? } */
export async function updatePrefs(req, res) {
  const preferences = { ...notificationPrefsOf(req.user), ...req.body };
  req.user.notificationPrefs = preferences;
  await req.user.save();
  res.json({ success: true, data: { preferences } });
}

/** GET /notifications */
export async function list(req, res) {
  res.json({ success: true, data: await notifications.listNotifications(req.user._id) });
}

/** GET /notifications/unread-count */
export async function unread(req, res) {
  res.json({ success: true, data: { unread: await notifications.unreadCount(req.user._id) } });
}

/** PATCH /notifications/:id/read */
export async function read(req, res) {
  const n = await notifications.markRead(req.user._id, req.params.id);
  if (!n) {
    throw ApiError.notFound('Notification not found');
  }
  res.json({ success: true, data: { notification: n.toPublicJSON() } });
}

/** POST /notifications/read-all */
export async function readAll(req, res) {
  await notifications.markAllRead(req.user._id);
  res.json({ success: true, data: { unread: 0 } });
}

/** DELETE /notifications/:id */
export async function remove(req, res) {
  if (!(await notifications.removeNotification(req.user._id, req.params.id))) {
    throw ApiError.notFound('Notification not found');
  }
  res.json({ success: true, data: { deleted: true } });
}
