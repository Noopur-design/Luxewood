import helmet from 'helmet'
import cors from 'cors'
import hpp from 'hpp'
import express from 'express'
import { config } from '../config.js'

/* ── Helmet — hardened HTTP response headers ──
   CSP, HSTS, X-Content-Type-Options, X-Frame-Options (DENY),
   Referrer-Policy, Cross-Origin-Resource-Policy and more. */
export const helmetMw = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],            // pure JSON API — nothing may load
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
})

/* ── CORS — strict origin allowlist ── */
export const corsMw = cors({
  origin (origin, cb) {
    // Allow non-browser tools (no Origin header) and allowlisted origins
    if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS: origin not allowed'))
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Admin-Key'],
  credentials: true,               // allow the httpOnly verification cookie
  maxAge: 600,
})

/* ── HTTP parameter pollution (?a=1&a=2 attacks) ── */
export const hppMw = hpp()

/* ── Body parsing with a hard size cap ── */
export const jsonBody = express.json({ limit: '16kb' })
