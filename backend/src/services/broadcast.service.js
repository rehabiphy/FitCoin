import mongoose from 'mongoose';
import AppSetting from '../models/AppSetting.js';
import DeviceToken from '../models/DeviceToken.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { deviceStats, sendToTokens } from './push.service.js';

const trusted = mongoose.trusted;
const HISTORY_KEY = 'broadcasts';
const HISTORY_SIZE = 20;
const BATCH = 1000;

function audienceFilter(audience) {
  const now = new Date();
  if (audience === 'premium') {
    return { premiumUntil: trusted({ $gt: now }) };
  }
  if (audience === 'free') {
    return { $or: trusted([{ premiumUntil: { $exists: false } }, { premiumUntil: null }, { premiumUntil: { $lte: now } }]) };
  }
  return {};
}

/**
 * Important app announcement from the admin panel: saved in every targeted member's
 * notification list and pushed to their phones. Announcements ignore members'
 * push settings, so keep them for things that matter (new features, outages, policy changes).
 */
export async function broadcast({ title, body, audience, route }, admin) {
  let members = 0;
  let sent = 0;
  let failed = 0;
  const cursor = User.find(audienceFilter(audience)).select('_id').lean().cursor({ batchSize: BATCH });

  let ids = [];
  const flush = async () => {
    if (!ids.length) {
      return;
    }
    members += ids.length;
    await Notification.insertMany(
      ids.map(user => ({ user, type: 'system', title, body, icon: 'Megaphone', color: 'primary' })),
      { ordered: false },
    );
    const tokens = await DeviceToken.distinct('token', { user: trusted({ $in: ids }) });
    const result = await sendToTokens(tokens, { title, body, category: 'important', data: { type: 'announcement', route } });
    sent += result.sent;
    failed += result.failed;
    ids = [];
  };

  for await (const u of cursor) {
    ids.push(u._id);
    if (ids.length >= BATCH) {
      await flush();
    }
  }
  await flush();

  const entry = { title, body, audience, route, members, sent, failed, sentAt: new Date(), by: admin.email };
  await AppSetting.updateOne(
    { key: HISTORY_KEY },
    { $push: { 'value.items': { $each: [entry], $position: 0, $slice: HISTORY_SIZE } } },
    { upsert: true },
  );
  return entry;
}

export async function broadcastInfo() {
  const [stats, history] = await Promise.all([deviceStats(), AppSetting.findOne({ key: HISTORY_KEY }).lean()]);
  return { ...stats, history: history?.value?.items || [] };
}
