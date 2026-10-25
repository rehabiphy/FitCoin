import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import env from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: { type: String, trim: true, maxlength: 20 },
    // Not returned by queries unless explicitly selected with .select('+password')
    password: { type: String, select: false, minlength: 8 },
    googleId: { type: String, unique: true, sparse: true, select: false },
    authProviders: { type: [String], enum: ['local', 'google'], default: [] },
    avatar: { type: String },
    emailVerified: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    stepGoal: { type: Number, min: 1000, max: 50000, default: 10000 },
    // Last known phone offset from UTC in minutes (IST = 330), for work done outside a request
    tzOffset: { type: Number, default: 0 },
    // Kept up to date as rewards land, so leaderboards can show streaks without recomputing
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String },
    bestStreak: { type: Number, default: 0 },
    // Set once the referral reward for this user (as the invited friend) has been paid or ruled out
    referralRewardedAt: { type: Date },
    referralStatus: { type: String, enum: ['pending', 'rewarded', 'capped'], default: undefined },
    // Short lock so two redemptions can't spend the same balance at once
    walletLockUntil: { type: Date, select: false },
    // Bumped to invalidate every outstanding token for this user (e.g. password change)
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  }
  if (!this.referralCode) {
    const base = (this.name || 'FIT').replace(/[^a-z]/gi, '').slice(0, 5).toUpperCase() || 'FIT';
    this.referralCode = `FIT-${base}${crypto.randomInt(10, 99)}${crypto.randomBytes(1).toString('hex').toUpperCase()}`;
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidate, this.password);
};

/** Shape sent to clients — never includes secrets. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone || null,
    avatar: this.avatar || null,
    emailVerified: this.emailVerified,
    referralCode: this.referralCode,
    authProviders: this.authProviders,
    role: this.role,
    stepGoal: this.stepGoal ?? 10000,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
