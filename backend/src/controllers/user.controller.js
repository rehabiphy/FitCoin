import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { issueTokens, revokeAllForUser } from '../services/token.service.js';

/** GET /users/me */
export async function getProfile(req, res) {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
}

/** PATCH /users/me */
export async function updateProfile(req, res) {
  const { name, phone, avatar, stepGoal } = req.body;
  if (stepGoal !== undefined) {
    req.user.stepGoal = stepGoal;
  }
  if (name !== undefined) {
    req.user.name = name;
  }
  if (phone !== undefined) {
    req.user.phone = phone || undefined;
  }
  if (avatar !== undefined) {
    req.user.avatar = avatar;
  }
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
}

/**
 * PATCH /users/me/password
 * Signs out every other device and returns a fresh token pair for this one.
 * Google-only accounts can use this to add a password (no currentPassword needed).
 */
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +tokenVersion');

  if (user.password) {
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw ApiError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }
  }

  user.password = newPassword;
  user.tokenVersion += 1;
  if (!user.authProviders.includes('local')) {
    user.authProviders.push('local');
  }
  await user.save();
  await revokeAllForUser(user._id);

  const tokens = await issueTokens(user, { userAgent: req.get('user-agent'), ip: req.ip });
  res.json({ success: true, data: { user: user.toPublicJSON(), tokens } });
}
