import rateLimit from 'express-rate-limit';

const handler = (req, res) =>
  res.status(429).json({
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later.' },
  });

/** General limit for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

/** Strict limit for credential endpoints to slow down brute force attacks. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
});
