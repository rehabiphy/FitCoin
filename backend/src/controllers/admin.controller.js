import { defaultRewardConfig, getBaseRewardConfig, rewardConfigMeta, saveRewardConfig } from '../services/rewardConfig.service.js';
import { MAX_ERA, coinParts, factorOf, getHalvingState, halve, saveHalvingSettings, undoHalving } from '../services/halving.service.js';
import mongoose from 'mongoose';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import { grantPremium, revokePremium } from '../services/premium.service.js';
import { getOverview, listUsers, toUserRow } from '../services/admin.service.js';
import { broadcast, broadcastInfo } from '../services/broadcast.service.js';
import {
  challengeOptions,
  createChallenge as create,
  listAdminChallenges,
  setChallengeStatus as setStatus,
  updateChallenge as update,
} from '../services/challengeAdmin.service.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { HABIT_GROUPS, HABIT_GROUP_IDS, groupOf } from '../config/rewards.js';

// Fixed habit details the panel needs to label its inputs
const HABITS = ACTIVITY_IDS.map(id => {
  const a = ACTIVITIES[id];
  return { id, name: a.name, unit: a.unit, rateUnit: a.rateUnit, rewardMode: a.rewardMode, unitSize: a.unitSize, group: groupOf(id) };
});
// Halving lists every challenge that isn't archived (paused ones too, so their fixed amounts can be kept)
const NOT_ARCHIVED = () => ({ archived: mongoose.trusted({ $ne: true }) });

const GROUPS = HABIT_GROUP_IDS.map(g => ({ id: g, name: HABIT_GROUPS[g].name, ids: HABIT_GROUPS[g].ids }));

/** GET /admin/overview */
export async function overview(req, res) {
  res.json({ success: true, data: await getOverview() });
}

const halvingSummary = state => ({ era: state.era, factor: factorOf(state.era), fixed: Object.keys(state.overrides).length });

/** GET /admin/config — base coin values (before halving) + premium plan */
export async function getConfig(req, res) {
  const [config, meta, halving] = await Promise.all([getBaseRewardConfig(), rewardConfigMeta(), getHalvingState()]);
  res.json({
    success: true,
    data: { config, defaults: defaultRewardConfig(), habits: HABITS, groups: GROUPS, meta, halving: halvingSummary(halving) },
  });
}

/** Everything the Halving page shows. */
async function halvingView(state) {
  const [base, challenges, users] = await Promise.all([
    getBaseRewardConfig(),
    Challenge.find(NOT_ARCHIVED()).sort({ sort: 1 }).select('slug title period reward').lean(),
    User.estimatedDocumentCount(),
  ]);
  return {
    era: state.era,
    factor: factorOf(state.era),
    maxEra: MAX_ERA,
    autoAtUsers: state.autoAtUsers,
    users,
    parts: coinParts(base, challenges, state),
    history: state.history,
  };
}

async function halvingKeys() {
  const [base, challenges] = await Promise.all([getBaseRewardConfig(), Challenge.find(NOT_ARCHIVED()).select('slug title period reward').lean()]);
  return new Set(coinParts(base, challenges, { era: 0, overrides: {} }).map(p => p.key));
}

/** GET /admin/halving */
export async function getHalving(req, res) {
  res.json({ success: true, data: await halvingView(await getHalvingState({ fresh: true })) });
}

/** POST /admin/halving/halve — { fromEra } */
export async function halveNow(req, res) {
  const state = await halve({ fromEra: req.body.fromEra, admin: req.user });
  res.json({ success: true, data: await halvingView(state) });
}

/** POST /admin/halving/undo — { fromEra } */
export async function undoHalve(req, res) {
  const state = await undoHalving({ fromEra: req.body.fromEra, admin: req.user });
  res.json({ success: true, data: await halvingView(state) });
}

/** PUT /admin/halving — { fromEra, overrides, autoAtUsers } */
export async function updateHalving(req, res) {
  const state = await saveHalvingSettings({ ...req.body, validKeys: await halvingKeys(), admin: req.user });
  res.json({ success: true, data: await halvingView(state) });
}

/** PUT /admin/config — replaces the whole config */
export async function updateConfig(req, res) {
  const config = await saveRewardConfig(req.body, req.user._id);
  res.json({ success: true, data: { config, meta: await rewardConfigMeta() } });
}

/** GET /admin/users?q=&premium=all|premium|free&page=&limit= */
export async function users(req, res) {
  res.json({ success: true, data: await listUsers(req.validatedQuery) });
}

/** POST /admin/users/:id/premium — { days } */
export async function grant(req, res) {
  const user = await grantPremium(req.params.id, req.body.days);
  res.json({ success: true, data: { user: toUserRow(user) } });
}

/** GET /admin/notifications — phones registered for push + recent announcements */
export async function notificationsInfo(req, res) {
  res.json({ success: true, data: await broadcastInfo() });
}

/** POST /admin/notifications — { title, body, audience, route } sends an announcement */
export async function sendAnnouncement(req, res) {
  res.json({ success: true, data: { result: await broadcast(req.body, req.user) } });
}

/** DELETE /admin/users/:id/premium */
export async function revoke(req, res) {
  const user = await revokePremium(req.params.id);
  res.json({ success: true, data: { user: toUserRow(user) } });
}

/** GET /admin/challenges — every challenge with stats, plus the form's options */
export async function challenges(req, res) {
  res.json({ success: true, data: { challenges: await listAdminChallenges(), options: challengeOptions() } });
}

/** POST /admin/challenges */
export async function createChallenge(req, res) {
  res.status(201).json({ success: true, data: { challenge: await create(req.body, req.user) } });
}

/** PUT /admin/challenges/:id — replaces the challenge's settings (its id/slug never changes) */
export async function updateChallenge(req, res) {
  res.json({ success: true, data: { challenge: await update(req.params.id, req.body, req.user) } });
}

/** PATCH /admin/challenges/:id/status — { active?, archived? } */
export async function setChallengeStatus(req, res) {
  res.json({ success: true, data: { challenge: await setStatus(req.params.id, req.body, req.user) } });
}
