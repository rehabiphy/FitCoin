import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['reward', 'streak', 'challenge', 'badge', 'redemption', 'referral', 'system'],
      default: 'system',
    },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 400 },
    icon: { type: String, default: 'Bell' },
    // Theme colour name the app maps to its palette (gold, mint, orange …)
    color: { type: String, default: 'primary' },
    read: { type: Boolean, default: false },
    // Prevents the same event notifying twice
    dedupeKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    title: this.title,
    body: this.body,
    icon: this.icon,
    color: this.color,
    unread: !this.read,
    createdAt: this.createdAt,
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
