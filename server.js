'use strict'

require('dotenv').config()

const Hapi      = require('@hapi/hapi')
const connectDB = require('./db')

const productRoutes   = require('./routes/ProductRoutes')
const authRoutes      = require('./routes/authRoutes')
const cartRoutes      = require('./routes/cartRoutes')
const reviewRoutes    = require('./routes/ReviewRoutes')
const dashboardRoutes = require('./routes/DashboardRoutes')
const reportsRoutes   = require('./routes/ReportsRoutes')

const init = async () => {
  await connectDB()

  const server = Hapi.server({
    port:  process.env.PORT || 8000,
    host:  '0.0.0.0',
    routes: {
      cors: {
        origin:      [process.env.CLIENT_URL || 'http://localhost:3000'],
        credentials: true,
        headers:     ['Accept', 'Content-Type', 'Authorization'],
        exposedHeaders: ['set-cookie'],
      },
      payload: { parse: true, output: 'data' },
    },
  })

  // ── Cookie state ─────────────────────────────────────────────────────────
  server.state('token', {
    ttl:        null,
    isSecure:   false,
    isHttpOnly: true,
    isSameSite: 'Lax',
    path:       '/',
    encoding:   'none',
  })

  // ── Global error handler — formats all Boom + unexpected errors ───────────
  server.ext('onPreResponse', (request, h) => {
    const { response } = request
    if (!response.isBoom) return h.continue

    const status  = response.output.statusCode
    const message = response.message || 'Internal Server Error'
    console.error(`[${status}] ${request.method.toUpperCase()} ${request.path} — ${message}`)
    return h.response({ message }).code(status)
  })

  // ── Routes ────────────────────────────────────────────────────────────────
  server.route([
    ...productRoutes,
    ...authRoutes,
    ...cartRoutes,
    ...reviewRoutes,
    ...dashboardRoutes,
    ...reportsRoutes,
    // Protected example
    {
      method: 'GET', path: '/api/protected', options: { auth: false },
      handler: (request, h) => {
        const { authenticate } = require('./middleware/authMiddleware')
        const user = authenticate(request)
        return h.response({ message: `Hello ${user.email}, you accessed a protected route!` }).code(200)
      },
    },
  ])

  await server.start()
  console.log(`✅ Hapi server running on ${server.info.uri}`)
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
  process.exit(1)
})

init()
