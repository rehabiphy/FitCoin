import mongoose from 'mongoose';

/**
 * Remembers push-only messages (habit reminders, health tips) that were already sent,
 * so a reminder goes out at most once even if the scheduler runs twice or on two servers.
 * Rows expire after a week.
 */
const pushLogSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now, expires: 7 * 86400 },
});

const PushLog = mongoose.model('PushLog', pushLogSchema);

export default PushLog;
