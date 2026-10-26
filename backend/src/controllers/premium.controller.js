import * as premium from '../services/premium.service.js';

/** GET /premium — plan, the user's status and free vs premium rates */
export async function info(req, res) {
  res.json({ success: true, data: await premium.getPremiumInfo(req.user) });
}

/** POST /premium/upgrade */
export async function upgrade(req, res) {
  res.json({ success: true, data: await premium.upgrade(req.user) });
}
