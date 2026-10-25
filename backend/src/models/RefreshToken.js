import mongoose from 'mongoose';

/**
 * One row per issued refresh token. Only a SHA-256 hash of the token is stored,
 * so a database leak does not expose usable tokens.
 * `family` groups a chain of rotated tokens so reuse of an old one can revoke the whole chain.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: String },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true },
);

// MongoDB removes expired rows automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.virtual('isActive').get(function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
