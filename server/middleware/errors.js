import { config } from '../config.js'

export function notFound (req, res) {
  res.status(404).json({ ok: false, error: 'Not found' })
}

/* Centralised error handler — clients never see stack traces or internals. */
export function errorHandler (err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, error: 'Payload too large' })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' })
  }
  console.error('[error]', err)
  res.status(500).json({
    ok: false,
    error: config.isProd ? 'Internal server error' : String(err.message || err),
  })
}

/* Admin-key gate for read endpoints */
export function requireAdminKey (req, res, next) {
  if (!config.adminApiKey) {
    return res.status(503).json({ ok: false, error: 'Admin access not configured' })
  }
  const key = req.get('X-Admin-Key') || ''
  if (key !== config.adminApiKey) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
  next()
}
