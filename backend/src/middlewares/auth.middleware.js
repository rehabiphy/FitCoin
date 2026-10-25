import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../services/token.service.js';

/** Requires a valid `Authorization: Bearer <accessToken>` header and loads `req.user`. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication required', 'NO_TOKEN');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid access token', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  // tokenVersion mismatch means the token was issued before a password change / logout-all
  if (!user || user.tokenVersion !== payload.tv) {
    throw ApiError.unauthorized('Session is no longer valid', 'INVALID_TOKEN');
  }

  req.user = user;
  next();
}

/** Restricts a route to the given roles. Use after requireAuth. */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw ApiError.forbidden();
    }
    next();
  };
