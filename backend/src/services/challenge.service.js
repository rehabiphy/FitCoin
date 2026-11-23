import mongoose from 'mongoose';
import Challenge from '../models/Challenge.js';
import ChallengeEnrollment from '../models/ChallengeEnrollment.js';
import StepDay from '../models/StepDay.js';
import DailyActivity from '../models/DailyActivity.js';
import ActivitySession from '../models/ActivitySession.js';
import ApiError from '../utils/ApiError.js';
import { creditOnce } from './rewards.service.js';
import { notify } from './notification.service.js';
import { coinValue, getHalvingState } from './halving.service.js';
import { addDays, localMidnightUtc, mondayOf, todayKey } from '../utils/dates.js';
import { periodLabel } from '../config/challenges.js';

const trusted = mongoose.trusted;

/**
 * The run of a challenge happening now: { periodKey, start, end (inclusive), endsAt, live }.
 * Daily and weekly challenges are always live; a custom event only between its dates.
 * An event has a single run, so its periodKey is fixed (editing its dates keeps enrollments).
 */
export function currentRun(challenge, tzOffset) {
  const today = todayKey(tzOffset);
  if (challenge.period === 'custom') {
    const { startDate: start, endDate: end } = challenge;
    return { periodKey: 'event', start, end, endsAt: localMidnightUtc(addDays(end, 1), tzOffset), live: today >= start && today <= end };
  }
  const start = challenge.period === 'weekly' ? mondayOf(today) : today;
  const end = challenge.period === 'weekly' ? addDays(start, 6) : start;
  return { periodKey: start, start, end, endsAt: localMidnightUtc(addDays(end, 1), tzOffset), live: true };
}

const inRange = (start, end) => trusted({ $gte: start, $lte: end });
const round1 = n => Math.round(n * 10) / 10;

// Challenges members can see (paused and archived ones are hidden)
const VISIBLE = () => ({ active: true, archived: trusted({ $ne: true }) });

/** The member's daily totals for one habit between two local dates: [{ date, value }]. */
async function dailyValues(activity, userId, start, end) {
  if (activity === 'walk') {
    const rows = await StepDay.find({ user: userId, date: inRange(start, end) }).select('date steps').lean();
    return rows.map(r => ({ date: r.date, value: r.steps }));
  }
  return DailyActivity.find({ user: userId, activity, date: inRange(start, end) }).select('date value').lean();
}

/** Progress toward a challenge's goal during a run, from the member's real activity. */
async function measure(challenge, userId, start, end) {
  const { activity, goalType } = challenge;
  if (goalType === 'session') {
    const best = await ActivitySession.findOne({
      user: userId,
      activity,
      status: 'completed',
      date: inRange(start, end),
      ...(challenge.startBefore ? { startMinuteOfDay: trusted({ $lt: challenge.startBefore }) } : {}),
    })
      .sort({ creditedValue: -1 })
      .select('creditedValue')
      .lean();
    return round1(best?.creditedValue || 0);
  }
  const rows = await dailyValues(activity, userId, start, end);
  if (goalType === 'days') {
    const need = challenge.dailyTarget || 0;
    return rows.filter(r => r.value > 0 && r.value >= need).length;
  }
  return round1(rows.reduce((s, r) => s + r.value, 0));
}

/** A challenge's prize today: its base reward, halved (or the admin's fixed amount). */
export const prizeOf = (challenge, halving) => coinValue(halving, `challenge.${challenge.slug}`, challenge.reward);

/** Recomputes progress for an enrollment and pays the prize the first time it is completed. */
async function updateProgress(enrollment, challenge, run, tzOffset) {
  const value = await measure(challenge, enrollment.user, run.start, run.end);
  enrollment.progress = Math.min(value, challenge.target);

  if (value >= challenge.target && !enrollment.rewarded) {
    const prize = prizeOf(challenge, await getHalvingState());
    const tx =
      prize > 0
        ? await creditOnce({
            userId: enrollment.user,
            refKey: `challenge:${enrollment.user}:${challenge._id}:${run.periodKey}`,
            amount: prize,
            type: 'bonus',
            category: 'challenge',
            title: `${challenge.title} complete`,
            subtitle: 'Challenge reward',
            activityDate: todayKey(tzOffset),
            meta: { challenge: challenge.slug, periodKey: run.periodKey },
          })
        : null;
    enrollment.completedAt = enrollment.completedAt || new Date();
    enrollment.rewarded = true;
    if (tx) {
      await notify(enrollment.user, {
        type: 'challenge',
        title: 'Challenge complete!',
        body: `You finished ${challenge.title} and earned ${prize} axyio.`,
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

function toPublic(challenge, run, { enrollment, participants, percentile, top, halving } = {}) {
  const joined = !!enrollment;
  const progressValue = enrollment?.progress || 0;
  return {
    id: challenge.slug,
    title: challenge.title,
    description: challenge.description,
    type: periodLabel(challenge.period),
    activity: challenge.activity,
    icon: challenge.icon,
    gradient: challenge.gradient,
    target: challenge.target,
    unitLabel: challenge.unitLabel,
    reward: halving ? prizeOf(challenge, halving) : challenge.reward,
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

async function findChallenge(idOrSlug, tzOffset) {
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug) };
  const challenge = await Challenge.findOne({ ...query, ...VISIBLE() });
  if (!challenge || !currentRun(challenge, tzOffset).live) {
    throw ApiError.notFound('Challenge not found');
  }
  return challenge;
}

export async function listChallenges(userId, tzOffset) {
  const [all, halving] = await Promise.all([Challenge.find(VISIBLE()).sort({ sort: 1, createdAt: 1 }), getHalvingState()]);
  const challenges = all.filter(c => currentRun(c, tzOffset).live);
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
      return toPublic(c, run, { enrollment, participants, halving });
    }),
  );
}

export async function getChallenge(userId, idOrSlug, tzOffset) {
  const c = await findChallenge(idOrSlug, tzOffset);
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

  return toPublic(c, run, { enrollment, participants, percentile, top, halving: await getHalvingState() });
}

export async function joinChallenge(userId, idOrSlug, tzOffset) {
  const c = await findChallenge(idOrSlug, tzOffset);
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
  const challenges = await Challenge.find(VISIBLE());
  for (const c of challenges) {
    const run = currentRun(c, tzOffset);
    if (!run.live) {
      continue;
    }
    const enrollment = await ChallengeEnrollment.findOne({ user: userId, challenge: c._id, periodKey: run.periodKey });
    if (enrollment && !enrollment.rewarded) {
      await updateProgress(enrollment, c, run, tzOffset);
    }
  }
}
