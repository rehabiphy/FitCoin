import { getChallenge, joinChallenge, listChallenges } from '../services/challenge.service.js';

/** GET /challenges?filter=all|daily|weekly|joined */
export async function list(req, res) {
  const { filter } = req.validatedQuery;
  let challenges = await listChallenges(req.user._id, req.tzOffset);
  if (filter === 'joined') {
    challenges = challenges.filter(c => c.joined);
  } else if (filter !== 'all') {
    challenges = challenges.filter(c => c.type.toLowerCase() === filter);
  }
  res.json({ success: true, data: { challenges } });
}

/** GET /challenges/:id */
export async function detail(req, res) {
  const challenge = await getChallenge(req.user._id, req.params.id, req.tzOffset);
  res.json({ success: true, data: { challenge } });
}

/** POST /challenges/:id/join */
export async function join(req, res) {
  const challenge = await joinChallenge(req.user._id, req.params.id, req.tzOffset);
  res.json({ success: true, data: { challenge } });
}
