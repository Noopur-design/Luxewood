import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),

  // CORS — only these origins may call the API
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(s => s.trim()).filter(Boolean),

  // Admin key required to read/export leads (GET /api/quotes)
  adminApiKey: process.env.ADMIN_API_KEY || null,
}
