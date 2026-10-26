import * as activities from '../services/activity.service.js';

/** GET /activities — every habit's progress today + summary */
export async function today(req, res) {
  res.json({ success: true, data: await activities.getToday(req.user, req.tzOffset) });
}

/** PUT /activities/selection — { habits: [ids] } a free member's active habits */
export async function select(req, res) {
  res.json({ success: true, data: await activities.selectHabits(req.user, req.body.habits, req.tzOffset) });
}

/** GET /activities/:id — one habit today + last 7 days */
export async function detail(req, res) {
  const activity = await activities.getActivity(req.user, req.params.id, req.tzOffset);
  res.json({ success: true, data: { activity } });
}

/** POST /activities/water/log — one glass */
export async function logWater(req, res) {
  const result = await activities.logWater(req.user._id, req.tzOffset);
  res.json({ success: true, data: result });
}

/** POST /activities/sleep/log — { hours } */
export async function logSleep(req, res) {
  const result = await activities.logSleep(req.user._id, req.tzOffset, req.body.hours);
  res.json({ success: true, data: result });
}

/** POST /activities/:id/sessions — start a timed session */
export async function startSession(req, res) {
  const session = await activities.startSession(req.user._id, req.params.id, req.tzOffset);
  res.status(201).json({ success: true, data: { session } });
}

/** POST /activities/sessions/:sessionId/finish — { value? } */
export async function finishSession(req, res) {
  const result = await activities.finishSession(req.user._id, req.params.sessionId, req.body);
  res.json({ success: true, data: result });
}

/** POST /activities/sessions/:sessionId/cancel */
export async function cancelSession(req, res) {
  const session = await activities.cancelSession(req.user._id, req.params.sessionId);
  res.json({ success: true, data: { session } });
}
