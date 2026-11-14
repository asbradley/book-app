// Rate limits for the routes that are expensive or attractive to abuse:
// login/register (password guessing, account spam), the Google Books proxies
// (shared API quota) and AI recommendations (each miss is a paid OpenAI call).
//
// Counters live in memory, so they reset on restart and aren't shared between
// server instances. That's fine for a single server; with several, swap in a
// shared store (e.g. Redis) via the `store` option.
//
// Set DISABLE_RATE_LIMITS=true to turn them off (the test suite does this, and
// the rate limit tests switch them back on). It's read on every request.

const { rateLimit } = require("express-rate-limit");

const MINUTE = 60 * 1000;

function limiter({ windowMs, limit, message, ...options }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7", // RateLimit + Retry-After headers
    legacyHeaders: false,
    message: { message },
    skip: () => process.env.DISABLE_RATE_LIMITS === "true",
    ...options,
  });
}

// Only failed logins count, so a user who signs in normally is never blocked
const loginLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});

const registerLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 10,
  message: "Too many accounts created from this network. Please try again later.",
});

// Book search and browsing, per IP
const searchLimiter = limiter({
  windowMs: MINUTE,
  limit: 60,
  message: "Too many searches. Please slow down and try again in a minute.",
});

// Per user rather than per IP. Must run after authenticateToken.
const recommendationsLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 20,
  keyGenerator: (req) => `user:${req.user.userId}`,
  message: "You've asked for a lot of recommendations. Please try again in a few minutes.",
});

module.exports = { loginLimiter, registerLimiter, searchLimiter, recommendationsLimiter };
