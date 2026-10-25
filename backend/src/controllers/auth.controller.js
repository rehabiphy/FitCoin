import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { verifyGoogleIdToken } from '../services/google.service.js';
import {
  issueTokens,
  revokeAllForUser,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  ACCESS_TTL,
} from '../services/token.service.js';

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered
const DUMMY_HASH = bcrypt.hashSync('fitcoin-dummy-password', env.bcryptRounds);

const requestMeta = req => ({ userAgent: req.get('user-agent'), ip: req.ip });

async function sendAuth(res, req, user, status = 200) {
  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await issueTokens(user, requestMeta(req));
  res.status(status).json({ success: true, data: { user: user.toPublicJSON(), tokens } });
}

/** POST /auth/register */
export async function register(req, res) {
  const { name, email, password, phone, referralCode } = req.body;

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }

  let referredBy;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode }).select('_id');
    if (!referrer) {
      throw ApiError.badRequest('Referral code is not valid', 'INVALID_REFERRAL');
    }
    referredBy = referrer._id;
  }

  const user = new User({ name, email, password, phone, referredBy, authProviders: ['local'] });
  await sendAuth(res, req, user, 201);
}

/** POST /auth/login */
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +tokenVersion');

  const valid = user?.password
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

  if (!valid) {
    throw ApiError.unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  }

  await sendAuth(res, req, user);
}

/** POST /auth/google — body: { idToken } from the Google Sign-In SDK */
export async function googleLogin(req, res) {
  const profile = await verifyGoogleIdToken(req.body.idToken);

  let user = await User.findOne({ googleId: profile.googleId }).select('+tokenVersion');
  let created = false;

  if (!user) {
    user = await User.findOne({ email: profile.email }).select('+tokenVersion');
    if (user) {
      // Google verified this email, so it's safe to link it to the existing account
      user.googleId = profile.googleId;
      user.emailVerified = true;
      if (!user.authProviders.includes('google')) {
        user.authProviders.push('google');
      }
      if (!user.avatar && profile.avatar) {
        user.avatar = profile.avatar;
      }
    } else {
      user = new User({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        avatar: profile.avatar,
        emailVerified: true,
        authProviders: ['google'],
      });
      created = true;
    }
  }

  await sendAuth(res, req, user, created ? 201 : 200);
}

/** POST /auth/refresh — body: { refreshToken }. Returns a new token pair. */
export async function refresh(req, res) {
  const { userId, refreshToken } = await rotateRefreshToken(req.body.refreshToken, requestMeta(req));

  const user = await User.findById(userId).select('+tokenVersion');
  if (!user) {
    await revokeRefreshToken(refreshToken);
    throw ApiError.unauthorized('Account no longer exists', 'INVALID_REFRESH_TOKEN');
  }

  res.json({
    success: true,
    data: {
      tokens: { accessToken: signAccessToken(user), refreshToken, tokenType: 'Bearer', expiresIn: ACCESS_TTL },
    },
  });
}

/** POST /auth/logout — body: { refreshToken }. Ends this device's session. */
export async function logout(req, res) {
  await revokeRefreshToken(req.body.refreshToken);
  res.json({ success: true, data: { message: 'Logged out' } });
}

/** POST /auth/logout-all — signs the user out on every device. */
export async function logoutAll(req, res) {
  req.user.tokenVersion += 1;
  await req.user.save();
  await revokeAllForUser(req.user._id);
  res.json({ success: true, data: { message: 'Logged out from all devices' } });
}

/** GET /auth/me */
export async function me(req, res) {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
}
