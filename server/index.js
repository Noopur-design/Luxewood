import express from 'express'
import compression from 'compression'
import morgan from 'morgan'
import { config } from './config.js'
import { helmetMw, corsMw, hppMw, jsonBody } from './middleware/security.js'
import { globalLimiter } from './middleware/rateLimiters.js'
import { notFound, errorHandler } from './middleware/errors.js'
import { firebaseReady } from './firebase.js'
import quoteRoutes from './routes/quotes.js'

const app = express()

app.set('trust proxy', 1)          // correct client IPs behind a reverse proxy
app.disable('x-powered-by')        // don't advertise the stack
app.disable('etag')                // avoid leaking response fingerprints

/* ── Security + performance middleware chain ── */
app.use(helmetMw)                  // hardened security headers (CSP, HSTS, …)
app.use(compression())             // gzip responses — faster payloads
app.use(corsMw)                    // strict origin allow-list
app.use(globalLimiter)             // global rate limit (anti-DoS / brute-force)
app.use(jsonBody)                  // 16kb JSON body cap
app.use(hppMw)                     // HTTP parameter-pollution guard
app.use(morgan(config.isProd ? 'combined' : 'dev'))  // access / audit log

/* ── Routes ── */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, store: firebaseReady() ? 'remote' : 'local' })
})
app.use('/api/quotes', quoteRoutes)

/* ── 404 + leak-free error handling ── */
app.use(notFound)
app.use(errorHandler)

const server = app.listen(config.port, () => {
  console.log(`[luxewood-api] listening on http://localhost:${config.port} (${config.isProd ? 'production' : 'development'})`)
  console.log(`[luxewood-api] allowed origins: ${config.allowedOrigins.join(', ')}`)
})

/* ── Slowloris / connection-exhaustion hardening ── */
server.headersTimeout = 15_000     // must send all headers within 15s
server.requestTimeout = 30_000     // whole request within 30s
server.keepAliveTimeout = 10_000   // idle keep-alive closed after 10s
