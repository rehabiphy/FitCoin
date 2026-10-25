import mongoose from 'mongoose';

/** A user's marketplace redemption and the voucher it produced. */
const redemptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reward: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
    brand: { type: String, required: true },
    title: { type: String, required: true },
    cost: { type: Number, required: true },
    fee: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    code: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

redemptionSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    rewardId: this.reward.toString(),
    brand: this.brand,
    title: this.title,
    cost: this.cost,
    fee: this.fee,
    total: this.total,
    status: this.status,
    code: this.code || null,
    expiresAt: this.expiresAt || null,
    createdAt: this.createdAt,
  };
};

const Redemption = mongoose.model('Redemption', redemptionSchema);

export default Redemption;
