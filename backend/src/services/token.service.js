import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';
import ApiError from '../utils/ApiError.js';

const UNITS = { s: 1, m: 60, h: 3600, d: 86400 };

/** "15m" -> 900. Plain numbers are treated as seconds. */
function toSeconds(value) {
  if (/^\d+$/.test(String(value))) {
    return Number(value);
  }
  const match = /^(\d+)\s*([smhd])$/.exec(String(value).trim());
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }
  return Number(match[1]) * UNITS[match[2]];
}

const ACCESS_TTL = toSeconds(env.jwt.accessExpiresIn);
const REFRESH_TTL = toSeconds(env.jwt.refreshExpiresIn);

/** Refresh tokens are opaque random strings; we store only a keyed hash of them. */
const hashToken = token => crypto.createHmac('sha256', env.jwt.refreshSecret).update(token).digest('hex');

export function signAccessToken(user) {
  return jwt.sign({ role: user.role, tv: user.tokenVersion ?? 0 }, env.jwt.accessSecret, {
    subject: user._id.toString(),
    expiresIn: ACCESS_TTL,
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret, {
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
    algorithms: ['HS256'],
  });
}

async function createRefreshToken(userId, { family, userAgent, ip } = {}) {
  const token = crypto.randomBytes(48).toString('base64url');
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    family: family || crypto.randomUUID(),
    expiresAt: new Date(Date.now() + REFRESH_TTL * 1000),
    userAgent: userAgent?.slice(0, 256),
    ip,
  });
  return token;
}

/** Issues a fresh access + refresh token pair (new session / token family). */
export async function issueTokens(user, meta) {
  const refreshToken = await createRefreshToken(user._id, meta);
  return {
    accessToken: signAccessToken(user),
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TTL,
  };
}

/**
 * Exchanges a refresh token for a new pair and revokes the old one (rotation).
 * If an already-used token is presented, someone may have stolen it, so the
 * whole family is revoked and the user must sign in again.
 */
export async function rotateRefreshToken(token, meta) {
  const tokenHash = hashToken(token);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }
  if (stored.revokedAt) {
    await RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { revokedAt: new Date() });
    throw ApiError.unauthorized('Session expired, please sign in again', 'REFRESH_TOKEN_REUSED');
  }
  if (stored.expiresAt <= new Date()) {
    throw ApiError.unauthorized('Session expired, please sign in again', 'REFRESH_TOKEN_EXPIRED');
  }

  // Atomic claim so two concurrent refreshes cannot both succeed
  const claimed = await RefreshToken.findOneAndUpdate(
    { _id: stored._id, revokedAt: null },
    { revokedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!claimed) {
    await RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { revokedAt: new Date() });
    throw ApiError.unauthorized('Session expired, please sign in again', 'REFRESH_TOKEN_REUSED');
  }

  const newToken = await createRefreshToken(stored.user, { ...meta, family: stored.family });
  claimed.replacedBy = hashToken(newToken);
  await claimed.save();

  return { userId: stored.user, refreshToken: newToken };
}

export async function revokeRefreshToken(token) {
  await RefreshToken.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { revokedAt: new Date() });
}

export async function revokeAllForUser(userId) {
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
}

export { ACCESS_TTL };
