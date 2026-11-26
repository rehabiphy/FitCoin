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
    // Four letters of the name + four digits, e.g. PART9801
    referralCode: { type: String, unique: true, sparse: true },
    // Codes this member had before (AXYIO-PARTH34CE); links shared with them still work
    legacyReferralCodes: { type: [String], default: undefined },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // When the friend's code was added (set once, never changed)
    referredAt: { type: Date },
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
    // As an inviter: how many friends were paid for in `referralMonth` ("YYYY-MM-01"), claimed atomically for the monthly cap
    referralMonth: { type: String },
    referralMonthCount: { type: Number, default: 0 },
    // Habits a free member picked to earn from (premium members earn from all). See habits.service.js
    activeHabits: { type: [String], default: undefined },
    habitsChosenAt: { type: Date },
    // Premium membership: active while premiumUntil is in the future
    premiumSince: { type: Date },
    premiumUntil: { type: Date },
    premiumSource: { type: String, enum: ['purchase', 'admin', 'test'], default: undefined },
    // Short lock so two redemptions can't spend the same balance at once
    walletLockUntil: { type: Date, select: false },
    // Bumped to invalidate every outstanding token for this user (e.g. password change)
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: { type: Date },
    // Which push notifications the member wants (in-app notifications are always kept).
    // Important app announcements ignore these.
    notificationPrefs: {
      reminders: { type: Boolean, default: true }, // personalised habit + streak reminders
      tips: { type: Boolean, default: true }, // daily stay-healthy tips
      rewards: { type: Boolean, default: true }, // rewards, badges, challenges, referrals
    },
  },
  { timestamps: true },
);

/** { reminders, tips, rewards } with every switch on unless the member turned it off. */
export const notificationPrefsOf = user => ({
  reminders: user?.notificationPrefs?.reminders !== false,
  tips: user?.notificationPrefs?.tips !== false,
  rewards: user?.notificationPrefs?.rewards !== false,
});

/** "Parth Panchal" -> "PART" + 4 random digits, e.g. PART9801. Short names are padded with X (AL -> ALXX); no Latin letters -> AXYO. */
export function makeReferralCode(name) {
  const letters = (String(name || '').replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'AXYO').padEnd(4, 'X');
  return `${letters}${String(crypto.randomInt(0, 10000)).padStart(4, '0')}`;
}

/** A code no member has now or had before. The unique index still guards against a race. */
export async function uniqueReferralCode(Model, name) {
  for (let i = 0; i < 20; i += 1) {
    const code = makeReferralCode(name);
    if (!(await Model.exists({ $or: [{ referralCode: code }, { legacyReferralCodes: code }] }))) {
      return code;
    }
  }
  // Very common name prefix: fall back to an extra digit rather than fail the sign-up
  return `${makeReferralCode(name)}${crypto.randomInt(0, 10)}`;
}

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  }
  if (!this.referralCode) {
    this.referralCode = await uniqueReferralCode(this.constructor, this.name);
  }
});

userSchema.index({ premiumUntil: 1 }, { sparse: true });
// "People who used your code" and badge counts look users up by their referrer
userSchema.index({ referredBy: 1 }, { sparse: true });
userSchema.index({ legacyReferralCodes: 1 }, { sparse: true });

userSchema.virtual('isPremium').get(function isPremium() {
  return !!this.premiumUntil && this.premiumUntil.getTime() > Date.now();
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
    // Whether this member already added a friend's code (it can only be added once)
    hasReferrer: !!this.referredBy,
    authProviders: this.authProviders,
    role: this.role,
    stepGoal: this.stepGoal ?? 10000,
    isPremium: this.isPremium,
    premiumUntil: this.isPremium ? this.premiumUntil : null,
    notificationPrefs: notificationPrefsOf(this),
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
