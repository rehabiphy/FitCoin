import mongoose from 'mongoose';
import DeviceToken from '../models/DeviceToken.js';
import User from '../models/User.js';
import DailyActivity from '../models/DailyActivity.js';
import StepDay from '../models/StepDay.js';
import PushLog from '../models/PushLog.js';
import { ACTIVITY_IDS } from '../config/activities.js';
import { getFcm } from '../config/firebase.js';
import { HEALTH_TIPS, MAX_REMINDERS_PER_DAY, REMINDER_SLOTS, SLOT_WINDOW_MINUTES, TIP_AT } from '../config/pushMessages.js';
import { getRewardConfig } from '../services/rewardConfig.service.js';
import { effectiveHabits } from '../services/habits.service.js';
import { allowsCategory, sendOnce } from '../services/push.service.js';
import { notify } from '../services/notification.service.js';
import { addDays, daysBetween, localNow, toDateKey } from '../utils/dates.js';

/**
 * Sends scheduled pushes in each member's own time zone:
 *  - personalised habit reminders (only for their active habits, only if not done yet today)
 *  - a streak-at-risk nudge and a "we miss you" after a few quiet days
 *  - one stay-healthy tip a day
 *  - a heads-up a few days before premium ends (also saved in the app)
 *
 * Runs every few minutes. Each message has a key (slot + user + local date) that is
 * claimed before sending, so restarts or several servers never send it twice.
 * Only members with a registered phone are looked at.
 */

const TICK_MS = 5 * 60 * 1000;
const BATCH = 200;
const PREMIUM_NOTICE_AT = 10 * 60; // 10:00 local
const PREMIUM_NOTICE_DAYS = 3;

const trusted = mongoose.trusted;

const inWindow = (minute, at) => minute >= at && minute < at + SLOT_WINDOW_MINUTES;

const firstName = name => (name || '').trim().split(/\s+/)[0] || 'there';

/** Same tip for everyone on a given day, cycling through the list. */
const tipFor = dateKey => HEALTH_TIPS[Math.floor(new Date(`${dateKey}T00:00:00Z`).getTime() / 86400000) % HEALTH_TIPS.length];

/** Today's progress per user: { [userId]: { walk, water, sleep, read, breathe, cycle } } */
async function progressFor(users) {
  const ids = users.map(u => u.user._id);
  const dates = [...new Set(users.map(u => u.today))];
  const [rows, steps] = await Promise.all([
    DailyActivity.find({ user: trusted({ $in: ids }), date: trusted({ $in: dates }) })
      .select('user activity date value')
      .lean(),
    StepDay.find({ user: trusted({ $in: ids }), date: trusted({ $in: dates }) })
      .select('user date steps')
      .lean(),
  ]);
  const todayOf = new Map(users.map(u => [u.user._id.toString(), u.today]));
  const out = new Map(users.map(u => [u.user._id.toString(), Object.fromEntries(ACTIVITY_IDS.map(id => [id, 0]))]));
  for (const r of rows) {
    const key = r.user.toString();
    if (todayOf.get(key) === r.date) {
      out.get(key)[r.activity] = r.value || 0;
    }
  }
  for (const s of steps) {
    const key = s.user.toString();
    if (todayOf.get(key) === s.date) {
      out.get(key).walk = s.steps || 0;
    }
  }
  return out;
}

async function remindersSentToday(userId, today) {
  // Keys look like "remind:<slot>:<userId>:<date>"
  const keys = await PushLog.find({ user: userId, key: new RegExp(`^remind:[^:]+:${userId}:${today}$`) })
    .select('_id')
    .lean();
  return keys.length;
}

async function processUser(entry, progress, config) {
  const { user, minute, today } = entry;
  const premium = config.premium.enabled && user.premiumUntil && new Date(user.premiumUntil) > new Date();

  // Stay-healthy tip
  if (inWindow(minute, TIP_AT) && allowsCategory(user, 'tips')) {
    const tip = tipFor(today);
    await sendOnce(`tip:${user._id}:${today}`, user, {
      ...tip,
      category: 'tips',
      data: { type: 'tip', route: 'Home', tag: 'tip' },
    });
  }

  // Premium ending soon (saved in the app too, so it uses notify)
  if (premium && inWindow(minute, PREMIUM_NOTICE_AT)) {
    const until = new Date(user.premiumUntil);
    const daysLeft = Math.ceil((until.getTime() - Date.now()) / 86400000);
    if (daysLeft <= PREMIUM_NOTICE_DAYS) {
      await notify(user._id, {
        type: 'system',
        title: 'Your Premium ends soon',
        body: `Premium ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew to keep earning ${config.premium.multiplier}x axyio on every habit.`,
        icon: 'Crown',
        color: 'gold',
        route: 'Premium',
        dedupeKey: `premium-ending:${user._id}:${toDateKey(until)}`,
      });
    }
  }

  // Habit reminders
  if (!allowsCategory(user, 'reminders')) {
    return;
  }
  const due = REMINDER_SLOTS.filter(s => inWindow(minute, s.at));
  if (!due.length) {
    return;
  }
  const active = new Set(premium ? ACTIVITY_IDS : effectiveHabits(user.activeHabits, config.freeHabitLimits));
  const ctx = {
    first: firstName(user.name),
    active,
    progress: progress.get(user._id.toString()),
    habits: config.habits,
    multiplier: premium ? config.premium.multiplier : 1,
    stepGoal: user.stepGoal || config.habits.walk.goal,
    streak: user.currentStreak || 0,
    lastActiveDate: user.lastActiveDate,
    today,
    yesterday: addDays(today, -1),
    daysSinceActive: user.lastActiveDate ? daysBetween(user.lastActiveDate, today) : null,
  };

  for (const slot of due) {
    const msg = slot.build(ctx);
    if (!msg) {
      continue;
    }
    if (!slot.essential && (await remindersSentToday(user._id, today)) >= MAX_REMINDERS_PER_DAY) {
      continue;
    }
    await sendOnce(`remind:${slot.id}:${user._id}:${today}`, user, {
      title: msg.title,
      body: msg.body,
      category: 'reminders',
      data: { type: 'reminder', reminder: slot.id, route: msg.route, params: msg.params, tag: `remind-${slot.id}` },
    });
  }
}

let running = false;

export async function runPushTick() {
  if (running || !getFcm() || mongoose.connection.readyState !== 1) {
    return;
  }
  running = true;
  try {
    const config = await getRewardConfig();
    const userIds = await DeviceToken.distinct('user');

    for (let i = 0; i < userIds.length; i += BATCH) {
      const users = await User.find({ _id: trusted({ $in: userIds.slice(i, i + BATCH) }) })
        .select('name tzOffset activeHabits premiumUntil stepGoal currentStreak lastActiveDate notificationPrefs')
        .lean();

      // Only members with something possibly due right now
      const entries = users
        .map(user => {
          const now = localNow(user.tzOffset || 0);
          return { user, minute: now.getUTCHours() * 60 + now.getUTCMinutes(), today: toDateKey(now) };
        })
        .filter(
          ({ minute }) =>
            inWindow(minute, TIP_AT) || inWindow(minute, PREMIUM_NOTICE_AT) || REMINDER_SLOTS.some(s => inWindow(minute, s.at)),
        );
      if (!entries.length) {
        continue;
      }

      const progress = await progressFor(entries);
      for (const entry of entries) {
        try {
          await processUser(entry, progress, config);
        } catch (err) {
          console.error(`Scheduled push failed for ${entry.user._id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('Push scheduler tick failed:', err.message);
  } finally {
    running = false;
  }
}

/** Starts the timer; returns a stop function. */
export function startPushScheduler() {
  const first = setTimeout(runPushTick, 30 * 1000);
  const timer = setInterval(runPushTick, TICK_MS);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
