import { Router } from 'express'
import { insertQuote, listQuotes } from '../db/sqlite.js'
import { mirrorLead } from '../firebase.js'
import { validate, quoteSchema } from '../middleware/validate.js'
import { quoteLimiter } from '../middleware/rateLimiters.js'
import { requireAdminKey } from '../middleware/errors.js'

const router = Router()

/* ── POST /api/quotes — public lead submission ──
   No login required. Protected by strict input validation, a hard body-size
   cap, HPP, CORS allow-list and per-IP rate limiting (quoteLimiter). */
router.post('/', quoteLimiter, validate(quoteSchema), async (req, res, next) => {
  try {
    const { name, email, phone, city, room, style, message, website } = req.body

    // Honeypot: a real (hidden) field only bots fill. Pretend success,
    // save nothing — so bots don't learn they were blocked.
    if (website) {
      return res.status(201).json({ ok: true, id: 0 })
    }

    const id = insertQuote({
      name, email, phone, city, room, style, message,
      ip: req.ip || '',
    })

    // Best-effort mirror to Firebase RTDB (leads/<id>)
    mirrorLead(id, { name, email, phone, city, room, style, message })

    res.status(201).json({ ok: true, id })
  } catch (e) { next(e) }
})

/* ── GET /api/quotes — admin-only lead export ── */
router.get('/', requireAdminKey, (req, res) => {
  res.json({ ok: true, quotes: listQuotes() })
})

export default router
