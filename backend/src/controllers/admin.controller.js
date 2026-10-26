import { defaultRewardConfig, getRewardConfig, rewardConfigMeta, saveRewardConfig } from '../services/rewardConfig.service.js';
import { grantPremium, revokePremium } from '../services/premium.service.js';
import { getOverview, listUsers, toUserRow } from '../services/admin.service.js';
import { ACTIVITIES, ACTIVITY_IDS } from '../config/activities.js';
import { HABIT_GROUPS, HABIT_GROUP_IDS, groupOf } from '../config/rewards.js';

// Fixed habit details the panel needs to label its inputs
const HABITS = ACTIVITY_IDS.map(id => {
  const a = ACTIVITIES[id];
  return { id, name: a.name, unit: a.unit, rateUnit: a.rateUnit, rewardMode: a.rewardMode, unitSize: a.unitSize, group: groupOf(id) };
});
const GROUPS = HABIT_GROUP_IDS.map(g => ({ id: g, name: HABIT_GROUPS[g].name, ids: HABIT_GROUPS[g].ids }));

/** GET /admin/overview */
export async function overview(req, res) {
  res.json({ success: true, data: await getOverview() });
}

/** GET /admin/config — live coin values + premium plan */
export async function getConfig(req, res) {
  const [config, meta] = await Promise.all([getRewardConfig(), rewardConfigMeta()]);
  res.json({ success: true, data: { config, defaults: defaultRewardConfig(), habits: HABITS, groups: GROUPS, meta } });
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

/** DELETE /admin/users/:id/premium */
export async function revoke(req, res) {
  const user = await revokePremium(req.params.id);
  res.json({ success: true, data: { user: toUserRow(user) } });
}
