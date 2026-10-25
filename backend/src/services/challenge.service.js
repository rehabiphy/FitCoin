import mongoose from 'mongoose';
import Challenge from '../models/Challenge.js';
import ChallengeEnrollment from '../models/ChallengeEnrollment.js';
import StepDay from '../models/StepDay.js';
import DailyActivity from '../models/DailyActivity.js';
import ActivitySession from '../models/ActivitySession.js';
import ApiError from '../utils/ApiError.js';
import { creditOnce } from './rewards.service.js';
import { notify } from './notification.service.js';
import { addDays, localMidnightUtc, mondayOf, todayKey } from '../utils/dates.js';

const trusted = mongoose.trusted;

/** The run of a challenge happening now: { periodKey, start, end (inclusive), endsAt }. */
export function currentRun(challenge, tzOffset) {
  const today = todayKey(tzOffset);
  const start = challenge.period === 'weekly' ? mondayOf(today) : today;
  const end = challenge.period === 'weekly' ? addDays(start, 6) : start;
  return { periodKey: start, start, end, endsAt: localMidnightUtc(addDays(end, 1), tzOffset) };
}

const inRange = (start, end) => trusted({ $gte: start, $lte: end });

/** Progress toward a challenge between two local dates, from the user's real activity. */
async function measure(metric, userId, start, end) {
  switch (metric) {
    case 'stepGoalDays':
      return StepDay.countDocuments({ user: userId, date: inRange(start, end), steps: trusted({ $gte: 10000 }) });
    case 'waterGlasses': {
      const rows = await DailyActivity.find({ user: userId, activity: 'water', date: inRange(start, end) });
      return rows.reduce((s, r) => s + r.value, 0);
    }
    case 'cycleKm': {
      const rows = await DailyActivity.find({ user: userId, activity: 'cycle', date: inRange(start, end) });
      return Math.round(rows.reduce((s, r) => s + r.value, 0) * 10) / 10;
    }
    case 'readGoalDays':
      return DailyActivity.countDocuments({ user: userId, activity: 'read', date: inRange(start, end), value: trusted({ $gte: 30 }) });
    case 'morningBreatheMinutes': {
      const best = await ActivitySession.findOne({
        user: userId,
        activity: 'breathe',
        status: 'completed',
        date: inRange(start, end),
        startMinuteOfDay: trusted({ $lt: 9 * 60 }),
      }).sort({ creditedValue: -1 });
      return best?.creditedValue || 0;
    }
    default:
      return 0;
  }
}

/** Recomputes progress for an enrollment and pays the prize the first time it is completed. */
async function updateProgress(enrollment, challenge, run, tzOffset) {
  const value = await measure(challenge.metric, enrollment.user, run.start, run.end);
  enrollment.progress = Math.min(value, challenge.target);

  if (value >= challenge.target && !enrollment.rewarded) {
    const tx = await creditOnce({
      userId: enrollment.user,
      refKey: `challenge:${enrollment.user}:${challenge._id}:${run.periodKey}`,
      amount: challenge.reward,
      type: 'bonus',
      category: 'challenge',
      title: `${challenge.title} complete`,
      subtitle: 'Challenge reward',
      activityDate: todayKey(tzOffset),
      meta: { challenge: challenge.slug, periodKey: run.periodKey },
    });
    enrollment.completedAt = enrollment.completedAt || new Date();
    enrollment.rewarded = true;
    if (tx) {
      await notify(enrollment.user, {
        type: 'challenge',
        title: 'Challenge complete!',
        body: `You finished ${challenge.title} and earned ${challenge.reward} FIT.`,
        icon: 'Trophy',
        color: 'gold',
        dedupeKey: `challenge:${enrollment._id}`,
      });
    }
  }
  if (enrollment.isModified()) {
    await enrollment.save();
  }
  return enrollment;
}

function toPublic(challenge, run, { enrollment, participants, percentile, top } = {}) {
  const joined = !!enrollment;
  const progressValue = enrollment?.progress || 0;
  return {
    id: challenge.slug,
    title: challenge.title,
    description: challenge.description,
    type: challenge.period === 'daily' ? 'Daily' : 'Weekly',
    icon: challenge.icon,
    gradient: challenge.gradient,
    target: challenge.target,
    unitLabel: challenge.unitLabel,
    reward: challenge.reward,
    participants: participants ?? 0,
    endsAt: run.endsAt,
    joined,
    progress: joined ? Math.min(1, progressValue / challenge.target) : 0,
    progressValue,
    progressLabel: joined ? `${progressValue} / ${challenge.target} ${challenge.unitLabel}`.trim() : 'Not started',
    completed: !!enrollment?.completedAt,
    rewarded: !!enrollment?.rewarded,
    ...(percentile !== undefined ? { percentile } : {}),
    ...(top ? { topParticipants: top } : {}),
  };
}

async function findChallenge(idOrSlug) {
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug) };
  const challenge = await Challenge.findOne({ ...query, active: true });
  if (!challenge) {
    throw ApiError.notFound('Challenge not found');
  }
  return challenge;
}

export async function listChallenges(userId, tzOffset) {
  const challenges = await Challenge.find({ active: true }).sort({ sort: 1 });
  return Promise.all(
    challenges.map(async c => {
      const run = currentRun(c, tzOffset);
      let [enrollment, participants] = await Promise.all([
        ChallengeEnrollment.findOne({ user: userId, challenge: c._id, periodKey: run.periodKey }),
        ChallengeEnrollment.countDocuments({ challenge: c._id, periodKey: run.periodKey }),
      ]);
      if (enrollment) {
        enrollment = await updateProgress(enrollment, c, run, tzOffset);
      }
      return toPublic(c, run, { enrollment, participants });
    }),
  );
}

export async function getChallenge(userId, idOrSlug, tzOffset) {
  const c = await findChallenge(idOrSlug);
  const run = currentRun(c, tzOffset);
  let enrollment = await ChallengeEnrollment.findOne({ user: userId, challenge: c._id, periodKey: run.periodKey });
  if (enrollment) {
    enrollment = await updateProgress(enrollment, c, run, tzOffset);
  }

  const [participants, topRows] = await Promise.all([
    ChallengeEnrollment.countDocuments({ challenge: c._id, periodKey: run.periodKey }),
    ChallengeEnrollment.find({ challenge: c._id, periodKey: run.periodKey })
      .sort({ progress: -1, completedAt: 1, createdAt: 1 })
      .limit(5)
      .populate('user', 'name avatar'),
  ]);

  let percentile;
  if (enrollment && participants > 1) {
    const behind = await ChallengeEnrollment.countDocuments({
      challenge: c._id,
      periodKey: run.periodKey,
      progress: trusted({ $lt: enrollment.progress }),
    });
    percentile = Math.round((behind / (participants - 1)) * 100);
  }

  const top = topRows
    .filter(r => r.user)
    .map((r, i) => ({
      rank: i + 1,
      userId: r.user._id.toString(),
      name: r.user.name,
      avatar: r.user.avatar || null,
      progressValue: r.progress,
      progress: Math.min(1, r.progress / c.target),
      isMe: r.user._id.toString() === userId.toString(),
    }));

  return toPublic(c, run, { enrollment, participants, percentile, top });
}

export async function joinChallenge(userId, idOrSlug, tzOffset) {
  const c = await findChallenge(idOrSlug);
  const run = currentRun(c, tzOffset);
  try {
    await ChallengeEnrollment.create({ user: userId, challenge: c._id, periodKey: run.periodKey });
  } catch (err) {
    if (err?.code !== 11000) {
      throw err;
    }
  }
  return getChallenge(userId, c.slug, tzOffset);
}

/** Called after any activity: refreshes progress (and pays prizes) for the user's current runs. */
export async function refreshUserChallenges(userId, tzOffset) {
  const challenges = await Challenge.find({ active: true });
  for (const c of challenges) {
    const run = currentRun(c, tzOffset);
    const enrollment = await ChallengeEnrollment.findOne({ user: userId, challenge: c._id, periodKey: run.periodKey });
    if (enrollment && !enrollment.rewarded) {
      await updateProgress(enrollment, c, run, tzOffset);
    }
  }
}
