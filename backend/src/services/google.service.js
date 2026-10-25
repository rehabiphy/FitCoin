import { OAuth2Client } from 'google-auth-library';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const client = new OAuth2Client();

/**
 * Verifies a Google ID token (signature, expiry, issuer and audience)
 * and returns the trusted profile fields.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!env.googleClientIds.length) {
    throw new ApiError(503, 'Google sign-in is not configured', 'GOOGLE_NOT_CONFIGURED');
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientIds });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }

  if (!payload?.sub || !payload.email) {
    throw ApiError.unauthorized('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }
  if (!payload.email_verified) {
    throw ApiError.forbidden('Google email is not verified', 'GOOGLE_EMAIL_UNVERIFIED');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture,
  };
}
