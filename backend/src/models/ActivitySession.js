import mongoose from 'mongoose';

/**
 * A timed session (reading, breathing, cycling). Start and finish times come
 * from the server clock, so the credited value can never exceed the real time spent.
 */
const activitySessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activity: { type: String, required: true, enum: ['read', 'breathe', 'cycle'] },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    // Local date the session counts towards and local minute-of-day it started (for "before 9 AM")
    date: { type: String, required: true },
    startMinuteOfDay: { type: Number },
    claimedValue: { type: Number },
    creditedValue: { type: Number, default: 0 },
  },
  { timestamps: true },
);

activitySessionSchema.index({ user: 1, status: 1 });
activitySessionSchema.index({ user: 1, activity: 1, date: -1 });

activitySessionSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    activity: this.activity,
    status: this.status,
    startedAt: this.startedAt,
    endedAt: this.endedAt || null,
    date: this.date,
    creditedValue: this.creditedValue,
  };
};

const ActivitySession = mongoose.model('ActivitySession', activitySessionSchema);

export default ActivitySession;
