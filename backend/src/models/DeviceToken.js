import mongoose from 'mongoose';

/**
 * One row per phone that can receive push notifications (an FCM registration token).
 * Saved when the user signs in, removed when they sign out, and dropped
 * automatically when FCM reports the token is no longer valid.
 */
const deviceTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, maxlength: 4096 },
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
    appVersion: { type: String, maxlength: 32 },
    // Bumped every time the app re-registers (each launch), so unused phones age out
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// A phone that hasn't opened the app in 90 days is forgotten
deviceTokenSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 90 * 86400 });

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

export default DeviceToken;
