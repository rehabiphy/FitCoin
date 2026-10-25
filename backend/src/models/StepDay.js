import mongoose from 'mongoose';

/**
 * One row per user per local calendar day. `steps` only ever goes up:
 * the phone's ledger is a running total for the day, so a lower value is an
 * old or out-of-order upload and is ignored.
 */
const stepDaySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Local date on the user's phone, "YYYY-MM-DD"
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    steps: { type: Number, required: true, min: 0, default: 0 },
    source: { type: String, enum: ['android_sensor', 'ios_pedometer', 'health', 'manual'], default: 'android_sensor' },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true },
);

stepDaySchema.index({ user: 1, date: -1 }, { unique: true });

stepDaySchema.methods.toPublicJSON = function toPublicJSON() {
  return { date: this.date, steps: this.steps, lastSyncedAt: this.lastSyncedAt };
};

const StepDay = mongoose.model('StepDay', stepDaySchema);

export default StepDay;
