import mongoose from 'mongoose';
import { ACTIVITY_IDS } from '../config/activities.js';
import { GOAL_TYPE_IDS, PERIODS } from '../config/challenges.js';

/**
 * A challenge, created in the admin panel (the built-in ones are seeded from
 * src/seed/challenges.js once, then edited like any other).
 * `slug` is the id the app uses and never changes after creation.
 * Goal fields are explained in src/config/challenges.js.
 */
const challengeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    period: { type: String, enum: PERIODS, required: true },
    // custom period only: local dates "YYYY-MM-DD", inclusive
    startDate: { type: String },
    endDate: { type: String },
    icon: { type: String, default: 'Target' },
    gradient: { type: [String], default: ['#7C5CFF', '#22D3EE'] },
    activity: { type: String, enum: ACTIVITY_IDS, required: true },
    goalType: { type: String, enum: GOAL_TYPE_IDS, required: true },
    dailyTarget: { type: Number, min: 0 },
    startBefore: { type: Number, min: 1, max: 1440 },
    target: { type: Number, required: true, min: 1 },
    unitLabel: { type: String, default: '' },
    // Base prize in FIT, before halving
    reward: { type: Number, required: true, min: 0 },
    // Paused challenges are hidden from the app; archived ones are also hidden in the panel
    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    sort: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
