import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    badge: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

export default UserBadge;
