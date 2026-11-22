import Challenge from '../models/Challenge.js';
import ChallengeEnrollment from '../models/ChallengeEnrollment.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { CHALLENGE_ICONS, GOAL_TYPES, GOAL_TYPE_IDS, defaultUnitLabel } from '../config/challenges.js';
import { getHalvingState } from './halving.service.js';
import { prizeOf } from './challenge.service.js';

/** What the panel needs to build the challenge form. */
export function challengeOptions() {
  return {
    activities: ACTIVITY_IDS.map(id => ({ id, name: ACTIVITIES[id].name, unit: ACTIVITIES[id].unit })),
    goalTypes: GOAL_TYPE_IDS.map(id => ({ id, name: GOAL_TYPES[id].name, activities: GOAL_TYPES[id].activities })),
    icons: CHALLENGE_ICONS,
  };
}

function toAdminRow(c, stats, halving) {
  return {
    id: c._id.toString(),
    slug: c.slug,
    title: c.title,
    description: c.description,
    period: c.period,
    startDate: c.startDate || null,
    endDate: c.endDate || null,
    icon: c.icon,
    gradient: c.gradient,
    activity: c.activity,
    goalType: c.goalType,
    dailyTarget: c.dailyTarget ?? null,
    startBefore: c.startBefore ?? null,
    target: c.target,
    unitLabel: c.unitLabel,
    reward: c.reward,
    // What members are paid today (after halving, or the admin's fixed amount)
    prize: prizeOf(c, halving),
    prizeFixed: halving.overrides[`challenge.${c.slug}`] !== undefined,
    active: c.active,
    archived: !!c.archived,
    sort: c.sort,
    joins: stats?.joins || 0,
    completions: stats?.completions || 0,
    paid: stats?.paid || 0,
    updatedAt: c.updatedAt,
  };
}

/** Every challenge (archived ones included) with all-time joins, completions and FIT paid. */
export async function listAdminChallenges() {
  const [challenges, enrollStats, paidStats, halving] = await Promise.all([
    Challenge.find().sort({ archived: 1, sort: 1, createdAt: 1 }).lean(),
    ChallengeEnrollment.aggregate([
      { $group: { _id: '$challenge', joins: { $sum: 1 }, completions: { $sum: { $cond: ['$rewarded', 1, 0] } } } },
    ]),
    Transaction.aggregate([
      { $match: { category: 'challenge' } },
      { $group: { _id: '$meta.challenge', paid: { $sum: '$amount' } } },
    ]),
    getHalvingState({ fresh: true }),
  ]);
  const byId = new Map(enrollStats.map(s => [s._id.toString(), s]));
  const paidBySlug = new Map(paidStats.map(s => [s._id, s.paid]));
  return challenges.map(c =>
    toAdminRow(c, { ...byId.get(c._id.toString()), paid: paidBySlug.get(c.slug) || 0 }, halving),
  );
}

async function rowFor(challenge) {
  const rows = await listAdminChallenges();
  return rows.find(r => r.id === challenge._id.toString());
}

const slugify = s =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'challenge';

/** A slug based on the title that no other challenge (archived included) uses. */
async function uniqueSlug(title) {
  const base = slugify(title);
  for (let i = 1; i < 1000; i += 1) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await Challenge.exists({ slug }))) {
      return slug;
    }
  }
  throw ApiError.conflict('Could not create a unique id for this challenge');
}

/** Normalises the validated form: drops fields that don't apply to the chosen goal and period. */
function cleanFields(body) {
  const fields = { ...body };
  const unset = {};
  if (fields.period !== 'custom') {
    unset.startDate = '';
    unset.endDate = '';
    delete fields.startDate;
    delete fields.endDate;
  }
  if (fields.goalType !== 'days') {
    unset.dailyTarget = '';
    delete fields.dailyTarget;
  }
  if (fields.goalType !== 'session' || !fields.startBefore) {
    unset.startBefore = '';
    delete fields.startBefore;
  }
  if (!fields.unitLabel) {
    fields.unitLabel = defaultUnitLabel(fields.goalType, fields.activity);
  }
  return { fields, unset };
}

export async function createChallenge(body, admin) {
  const { fields } = cleanFields(body);
  if (fields.sort === undefined) {
    const last = await Challenge.findOne().sort({ sort: -1 }).select('sort').lean();
    fields.sort = (last?.sort || 0) + 1;
  }
  const challenge = await Challenge.create({ ...fields, slug: await uniqueSlug(fields.title), createdBy: admin._id, updatedBy: admin._id });
  return rowFor(challenge);
}

async function findById(id) {
  const challenge = await Challenge.findById(id);
  if (!challenge) {
    throw ApiError.notFound('Challenge not found');
  }
  return challenge;
}

/**
 * Replaces a challenge's settings. The slug stays the same, so members who
 * joined keep their progress (it is re-measured with the new goal).
 */
export async function updateChallenge(id, body, admin) {
  await findById(id);
  const { fields, unset } = cleanFields(body);
  const challenge = await Challenge.findByIdAndUpdate(
    id,
    { $set: { ...fields, updatedBy: admin._id }, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { returnDocument: 'after', runValidators: true },
  );
  return rowFor(challenge);
}

/** Pause / resume (hide from or show in the app) and archive / restore. */
export async function setChallengeStatus(id, { active, archived }, admin) {
  const challenge = await findById(id);
  if (active !== undefined) {
    challenge.active = active;
  }
  if (archived !== undefined) {
    challenge.archived = archived;
    // An archived challenge is never live; restoring brings it back paused so it can be checked first
    challenge.active = archived ? false : (active ?? false);
  }
  challenge.updatedBy = admin._id;
  await challenge.save();
  return rowFor(challenge);
}
