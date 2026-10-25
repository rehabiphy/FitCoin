import ApiError from '../utils/ApiError.js';
import * as notifications from '../services/notification.service.js';

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
