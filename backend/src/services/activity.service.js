import mongoose from 'mongoose';
import DailyActivity from '../models/DailyActivity.js';
import ActivitySession from '../models/ActivitySession.js';
import StepDay from '../models/StepDay.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { creditDailyReward } from './rewards.service.js';
import { afterActivity } from './progress.service.js';
import { lastDays, localNow, todayKey } from '../utils/dates.js';

const trusted = mongoose.trusted;
const round1 = n => Math.round(n * 10) / 10;

function config(id) {
  const cfg = ACTIVITIES[id];
  if (!cfg) {
    throw ApiError.notFound('Unknown activity');
  }
  return cfg;
}

const formatValue = (cfg, v) => (cfg.unit === 'steps' ? Math.round(v).toLocaleString('en-US') : `${round1(v)}`);

/** Credits the reward for an activity's current daily total, then runs streak/challenge/badge updates. */
async function creditActivity(userId, activityId, date) {
  const cfg = ACTIVITIES[activityId];
  const day = await DailyActivity.findOne({ user: userId, activity: activityId, date });
  const value = day?.value || 0;
  const goalReached = value >= cfg.goal;
  const added = await creditDailyReward({
    userId,
    date,
    key: `act-${activityId}`,
    amount: cfg.reward(value),
    category: 'activity',
    title: `${cfg.name} reward`,
    goalTitle: `${cfg.name} goal met`,
    goalReached,
    subtitle: `${cfg.name} · ${formatValue(cfg, value)} ${cfg.unit}`,
    meta: { activity: activityId, value },
    goalNotification: {
      title: `${cfg.name} goal met!`,
      body: `You hit today's ${cfg.name.toLowerCase()} goal and earned ${cfg.reward(value)} FIT.`,
      icon: 'Coins',
      color: 'gold',
    },
  });
  // Challenges can need more than the daily reward covers (e.g. 50 km a week), so always refresh
  await afterActivity(userId, date);
  return { value, fitAdded: added };
}

async function addToDay(userId, activityId, date, delta) {
  return DailyActivity.findOneAndUpdate(
    { user: userId, activity: activityId, date },
    { $inc: { value: delta, entries: 1 }, $set: { lastLoggedAt: new Date() } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
}

/** POST /activities/water/log — one glass. */
export async function logWater(userId, tzOffset) {
  const cfg = ACTIVITIES.water;
  const date = todayKey(tzOffset);
  const day = await DailyActivity.findOne({ user: userId, activity: 'water', date });
  if (day?.value >= cfg.maxPerDay) {
    throw ApiError.badRequest(`You can log up to ${cfg.maxPerDay} glasses a day`, 'DAILY_LIMIT');
  }
  if (day?.lastLoggedAt && Date.now() - day.lastLoggedAt.getTime() < cfg.minMinutesBetween * 60000) {
    throw ApiError.badRequest(`Log one glass at a time — wait ${cfg.minMinutesBetween} minutes between glasses`, 'TOO_SOON');
  }
  // Claim atomically against the previous state so double taps can't both count
  const filter = day
    ? { _id: day._id, value: day.value }
    : { user: userId, activity: 'water', date };
  try {
    const updated = await DailyActivity.findOneAndUpdate(
      filter,
      { $inc: { value: 1, entries: 1 }, $set: { lastLoggedAt: new Date() } },
      { upsert: !day, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    if (!updated) {
      throw ApiError.conflict('Already logged, please try again', 'TOO_SOON');
    }
  } catch (err) {
    if (err?.code === 11000) {
      throw ApiError.conflict('Already logged, please try again', 'TOO_SOON');
    }
    throw err;
  }
  return creditActivity(userId, 'water', date);
}

/** POST /activities/sleep/log — last night's sleep, counted for today. Latest log wins. */
export async function logSleep(userId, tzOffset, hours) {
  const cfg = ACTIVITIES.sleep;
  const date = todayKey(tzOffset);
  const value = Math.min(cfg.maxValue, round1(hours));
  await DailyActivity.findOneAndUpdate(
    { user: userId, activity: 'sleep', date },
    { $set: { value, lastLoggedAt: new Date() }, $inc: { entries: 1 } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  return creditActivity(userId, 'sleep', date);
}

/** Cancels sessions left running past their maximum length (app killed mid-session etc.). */
async function expireStaleSessions(userId) {
  const sessions = await ActivitySession.find({ user: userId, status: 'active' });
  const now = Date.now();
  for (const s of sessions) {
    const max = ACTIVITIES[s.activity].maxSessionMinutes;
    if (now - s.startedAt.getTime() > max * 60000) {
      s.status = 'cancelled';
      s.endedAt = new Date();
      await s.save();
    }
  }
}

/** POST /activities/:id/sessions — start a timer on the server. */
export async function startSession(userId, activityId, tzOffset) {
  const cfg = config(activityId);
  if (cfg.kind !== 'session') {
    throw ApiError.badRequest(`${cfg.name} doesn't use sessions`, 'NOT_A_SESSION');
  }
  await expireStaleSessions(userId);
  const existing = await ActivitySession.findOne({ user: userId, activity: activityId, status: 'active' });
  if (existing) {
    return existing.toPublicJSON();
  }
  const now = localNow(tzOffset);
  const session = await ActivitySession.create({
    user: userId,
    activity: activityId,
    startedAt: new Date(),
    date: todayKey(tzOffset),
    startMinuteOfDay: now.getUTCHours() * 60 + now.getUTCMinutes(),
  });
  return session.toPublicJSON();
}

async function findActiveSession(userId, sessionId) {
  if (!mongoose.isValidObjectId(sessionId)) {
    throw ApiError.notFound('Session not found');
  }
  const session = await ActivitySession.findOne({ _id: sessionId, user: userId });
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  if (session.status !== 'active') {
    throw ApiError.badRequest('This session has already ended', 'SESSION_ENDED');
  }
  return session;
}

/**
 * POST /activities/sessions/:id/finish
 * Minutes come from the server clock. For cycling the app sends the distance,
 * which must be possible in the time the ride took.
 */
export async function finishSession(userId, sessionId, { value } = {}) {
  const session = await findActiveSession(userId, sessionId);
  const cfg = ACTIVITIES[session.activity];
  const endedAt = new Date();
  const minutes = Math.min(cfg.maxSessionMinutes, (endedAt - session.startedAt) / 60000);

  let credited;
  if (session.activity === 'cycle') {
    if (typeof value !== 'number') {
      throw ApiError.badRequest('Send the distance ridden in km', 'VALUE_REQUIRED');
    }
    const maxKm = (minutes / 60) * cfg.maxSpeedKmh;
    if (value > maxKm + 0.05) {
      throw ApiError.badRequest('That distance is not possible in the time recorded', 'IMPLAUSIBLE_VALUE');
    }
    credited = round1(value);
  } else {
    // Whole minutes only; the app may report fewer minutes (e.g. paused), never more
    const claimed = typeof value === 'number' ? Math.min(value, minutes) : minutes;
    credited = Math.floor(claimed);
  }

  // Claim atomically so a double tap can't finish (and credit) twice
  const claimed = await ActivitySession.findOneAndUpdate(
    { _id: session._id, status: 'active' },
    { status: 'completed', endedAt, claimedValue: value ?? null, creditedValue: credited },
    { returnDocument: 'after' },
  );
  if (!claimed) {
    throw ApiError.badRequest('This session has already ended', 'SESSION_ENDED');
  }

  if (credited > 0) {
    await addToDay(userId, session.activity, session.date, credited);
  }
  const result = await creditActivity(userId, session.activity, session.date);
  return { session: claimed.toPublicJSON(), ...result };
}

export async function cancelSession(userId, sessionId) {
  const session = await findActiveSession(userId, sessionId);
  session.status = 'cancelled';
  session.endedAt = new Date();
  await session.save();
  return session.toPublicJSON();
}

/** Today's total for every activity plus what it has earned. */
export async function getToday(user, tzOffset) {
  const date = todayKey(tzOffset);
  await expireStaleSessions(user._id);
  const [stepDay, days, rewards, sessions] = await Promise.all([
    StepDay.findOne({ user: user._id, date }),
    DailyActivity.find({ user: user._id, date }),
    Transaction.find({ user: user._id, activityDate: date, category: trusted({ $in: ['steps', 'activity'] }) }),
    ActivitySession.find({ user: user._id, status: 'active' }),
  ]);
  const valueOf = new Map(days.map(d => [d.activity, d.value]));
  const earnedOf = new Map(rewards.map(t => [t.meta?.activity || (t.category === 'steps' ? 'walk' : null), t.amount]));
  const sessionOf = new Map(sessions.map(s => [s.activity, s.toPublicJSON()]));

  const activities = ACTIVITY_IDS.map(id => {
    const cfg = ACTIVITIES[id];
    const current = id === 'walk' ? stepDay?.steps || 0 : valueOf.get(id) || 0;
    const goal = id === 'walk' ? user.stepGoal || cfg.goal : cfg.goal;
    return {
      id,
      name: cfg.name,
      kind: cfg.kind,
      unit: cfg.unit,
      current: round1(current),
      goal,
      progress: Math.min(1, current / goal),
      completed: current >= goal,
      reward: cfg.maxReward,
      earned: earnedOf.get(id) || 0,
      rate: cfg.rate,
      verified: cfg.verified,
      activeSession: sessionOf.get(id) || null,
    };
  });

  const earned = activities.reduce((s, a) => s + a.earned, 0);
  const potential = activities.reduce((s, a) => s + a.reward, 0);
  return {
    date,
    activities,
    summary: {
      score: activities.reduce((s, a) => s + a.progress, 0) / activities.length,
      done: activities.filter(a => a.completed).length,
      total: activities.length,
      earned,
      potential,
      remaining: Math.max(0, potential - earned),
    },
    lastStepSyncAt: stepDay?.lastSyncedAt || null,
  };
}

/** One activity: today's numbers plus the last 7 days. */
export async function getActivity(user, activityId, tzOffset) {
  const cfg = config(activityId);
  const today = await getToday(user, tzOffset);
  const item = today.activities.find(a => a.id === activityId);
  const dates = lastDays(tzOffset, 7);
  let history;
  if (activityId === 'walk') {
    const rows = await StepDay.find({ user: user._id, date: trusted({ $in: dates }) });
    const map = new Map(rows.map(r => [r.date, r.steps]));
    history = dates.map(date => ({ date, value: map.get(date) || 0 }));
  } else {
    const rows = await DailyActivity.find({ user: user._id, activity: activityId, date: trusted({ $in: dates }) });
    const map = new Map(rows.map(r => [r.date, r.value]));
    history = dates.map(date => ({ date, value: round1(map.get(date) || 0) }));
  }
  return {
    ...item,
    maxSessionMinutes: cfg.maxSessionMinutes || null,
    history,
    goalDays: history.filter(h => h.value >= item.goal).length,
  };
}
