import mongoose from 'mongoose';

/**
 * The FIT ledger. The wallet balance is always calculated from these rows,
 * so there is no separate balance field that could drift out of sync.
 * Positive amounts are credits, negative amounts are debits.
 */
const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earn', 'bonus', 'redeem', 'fee', 'expire'], required: true },
    category: {
      type: String,
      enum: ['steps', 'activity', 'streak', 'challenge', 'referral', 'marketplace', 'system'],
      required: true,
    },
    amount: { type: Number, required: true },
    title: { type: String, required: true, maxlength: 120 },
    subtitle: { type: String, maxlength: 160 },
    status: { type: String, enum: ['completed', 'pending', 'processing', 'expired'], default: 'completed' },
    // Local day the reward belongs to ("YYYY-MM-DD"), used for "earned today" and the weekly chart
    activityDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    // Makes a reward idempotent: e.g. "steps:<userId>:2026-10-25" exists at most once
    refKey: { type: String, unique: true, sparse: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ user: 1, activityDate: 1 });

transactionSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    category: this.category,
    activity: this.meta?.activity || null,
    reference: `FTX-${this._id.toString().slice(-10).toUpperCase()}`,
    amount: this.amount,
    title: this.title,
    subtitle: this.subtitle || null,
    status: this.status,
    activityDate: this.activityDate || null,
    voucherCode: this.meta?.code || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
