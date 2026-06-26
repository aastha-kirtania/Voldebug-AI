import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100, // 100 requests per window
  message: {
    data: null,
    error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests, please try again later." },
    meta: { timestamp: new Date().toISOString() },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 30, // 30 requests per window for auth routes in prod, 1000 in dev
  message: {
    data: null,
    error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many authentication attempts. Please try again later." },
    meta: { timestamp: new Date().toISOString() },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
