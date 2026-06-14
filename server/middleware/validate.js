import { z } from 'zod'

/* ── Shared field schemas ── */

// Indian mobile: optional +91 / 0 prefix, then 10 digits starting 6-9
export const phoneSchema = z.string()
  .trim()
  .transform(v => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(\+91|0)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number'))
  .transform(v => '+91' + v.replace(/^(\+91|0)/, ''))   // normalise to +91XXXXXXXXXX

const nameSchema = z.string().trim().min(2, 'Name too short').max(80, 'Name too long')
  .regex(/^[\p{L}\p{M}.'\- ]+$/u, 'Name contains invalid characters')

const citySchema = z.string().trim().min(2).max(60)
  .regex(/^[\p{L} .\-]+$/u, 'City contains invalid characters')

/* ── Request schemas (.strict() rejects unknown fields) ── */

export const quoteSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,                       // required — for the callback
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(120)
    .optional().or(z.literal('')).default(''),
  city: citySchema,
  // Honeypot — a hidden field real users never see. Bots fill it.
  website: z.string().max(200).optional().default(''),
  room: z.string().trim().max(40).optional().default(''),
  style: z.string().trim().max(60).optional().default(''),
  message: z.string().trim().max(1000).optional().default(''),
}).strict()

/* ── Middleware factory — validates req.body against a schema ── */
export const validate = schema => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {})
  if (!result.success) {
    const fields = {}
    for (const issue of result.error.issues) {
      fields[issue.path.join('.') || '_'] = issue.message
    }
    return res.status(400).json({ ok: false, error: 'Validation failed', fields })
  }
  req.body = result.data   // sanitised + normalised payload only
  next()
}
