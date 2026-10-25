import mongoose from 'mongoose';

/** A marketplace item that can be redeemed for FIT (seeded from src/seed/rewards.js). */
const rewardSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    cost: { type: Number, required: true, min: 1 },
    icon: { type: String, default: 'Gift' },
    gradient: { type: [String], default: ['#7C5CFF', '#22D3EE'] },
    // null = unlimited
    stock: { type: Number, default: null, min: 0 },
    tag: { type: String },
    validDays: { type: Number, default: 90 },
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true },
);

rewardSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    slug: this.slug,
    brand: this.brand,
    title: this.title,
    description: this.description || null,
    category: this.category,
    cost: this.cost,
    icon: this.icon,
    gradient: this.gradient,
    stock: this.stock,
    stockLabel: this.stock === null ? 'In stock' : this.stock > 0 ? `${this.stock} left` : 'Out of stock',
    inStock: this.stock === null || this.stock > 0,
    tag: this.tag || null,
    validDays: this.validDays,
  };
};

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
