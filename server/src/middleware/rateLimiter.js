import { rateLimit } from 'express-rate-limit';

/**
 * Stricter rate limiter for AI endpoints.
 * Prevents abuse of expensive Gemini API calls.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI rate limit exceeded. Please wait before making more AI requests.',
  },
});
