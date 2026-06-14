import rateLimit from 'express-rate-limit'

const json429 = (msg) => (req, res) =>
  res.status(429).json({ ok: false, error: msg })

/* Global safety net — applies to every request */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json429('Too many requests. Please try again later.'),
})

/* Quote submissions — per-IP throttle (brute-force / spam protection) */
export const quoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json429('Too many quote requests. Try again later.'),
})
