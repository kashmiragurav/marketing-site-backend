// server.js  — Hapi.js entry point (replaces index.js)
'use strict'

require('dotenv').config()

const Hapi    = require('@hapi/hapi')
const connectDB = require('./db')

// Route registrations
const productRoutes   = require('./routes/ProductRoutes')
const authRoutes      = require('./routes/authRoutes')
const cartRoutes      = require('./routes/cartRoutes')
const reviewRoutes    = require('./routes/ReviewRoutes')
const dashboardRoutes = require('./routes/DashboardRoutes')
const reportsRoutes   = require('./routes/ReportsRoutes')

const init = async () => {
  // ── Connect DB first ────────────────────────────────────────────────────
  await connectDB()

  const server = Hapi.server({
    port:  process.env.PORT || 5000,
    host:  '0.0.0.0',
    routes: {
      cors: {
        // Hapi built-in CORS — replaces the cors() Express middleware
        origin:      [process.env.CLIENT_URL || 'http://localhost:3000'],
        credentials: true,   // allow cookies
        headers:     ['Accept', 'Content-Type', 'Authorization'],
      },
      // Hapi parses JSON bodies automatically — replaces express.json()
      payload: {
        parse:  true,
        output: 'data',
      },
    },
  })

  // ── Cookie support — replaces cookie-parser ─────────────────────────────
  // Hapi reads cookies natively via request.state; no plugin needed.
  // Register the cookie name so Hapi knows how to parse it.
  server.state('token', {
    ttl:      null,
    isSecure: false,          // set true in production (HTTPS)
    isHttpOnly: true,
    isSameSite: 'Lax',
    path:     '/',
    encoding: 'none',         // JWT is already a string — no extra encoding
  })

  // ── Global error extension — replaces errorHandler middleware ───────────
  server.ext('onPreResponse', (request, h) => {
    const response = request.response
    if (response.isBoom) {
      // Boom errors (thrown by routes/plugins) — format matches Express errorHandler
      const err    = response
      const status = err.output.statusCode
      return h.response({ message: err.message }).code(status)
    }
    return h.continue
  })

  // ── Register all route groups ────────────────────────────────────────────
  server.route(productRoutes)
  server.route(authRoutes)
  server.route(cartRoutes)
  server.route(reviewRoutes)
  server.route(dashboardRoutes)
  server.route(reportsRoutes)

  // ── Protected example route ──────────────────────────────────────────────
  server.route({
    method:  'GET',
    path:    '/api/protected',
    options: { auth: false },   // auth handled manually inside handler
    handler: async (request, h) => {
      const { authenticate } = require('./middleware/authMiddleware')
      const user = authenticate(request)   // throws Boom.unauthorized if invalid
      return { message: `Hello ${user.email}, you accessed a protected route!` }
    },
  })

  await server.start()
  console.log(`Server running on ${server.info.uri}`)
}

process.on('unhandledRejection', (err) => {
  console.error(err)
  process.exit(1)
})

init()
