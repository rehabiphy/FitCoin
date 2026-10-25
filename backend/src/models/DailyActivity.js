import mongoose from 'mongoose';

/**
 * Per user, per activity, per local day: the running total for that day
 * (glasses, minutes, km, sleep hours). Walking lives in StepDay instead.
 */
const dailyActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activity: { type: String, required: true, enum: ['water', 'sleep', 'read', 'breathe', 'cycle'] },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    value: { type: Number, default: 0, min: 0 },
    entries: { type: Number, default: 0 },
    lastLoggedAt: { type: Date },
  },
  { timestamps: true },
);

dailyActivitySchema.index({ user: 1, activity: 1, date: -1 }, { unique: true });
dailyActivitySchema.index({ user: 1, date: -1 });

const DailyActivity = mongoose.model('DailyActivity', dailyActivitySchema);

export default DailyActivity;
