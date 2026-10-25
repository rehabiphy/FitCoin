import mongoose from 'mongoose';

/** A user taking part in one run of a challenge (periodKey = the day, or the week's Monday). */
const challengeEnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    periodKey: { type: String, required: true },
    progress: { type: Number, default: 0 },
    completedAt: { type: Date },
    rewarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

challengeEnrollmentSchema.index({ user: 1, challenge: 1, periodKey: 1 }, { unique: true });
challengeEnrollmentSchema.index({ challenge: 1, periodKey: 1, progress: -1 });

const ChallengeEnrollment = mongoose.model('ChallengeEnrollment', challengeEnrollmentSchema);

export default ChallengeEnrollment;
