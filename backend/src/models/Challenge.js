import mongoose from 'mongoose';

/** A recurring challenge (seeded from src/seed/challenges.js). */
const challengeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    period: { type: String, enum: ['daily', 'weekly'], required: true },
    icon: { type: String, default: 'Target' },
    gradient: { type: [String], default: ['#7C5CFF', '#22D3EE'] },
    metric: { type: String, required: true },
    target: { type: Number, required: true, min: 1 },
    unitLabel: { type: String, default: '' },
    reward: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
