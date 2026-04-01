'use strict'

const jwt  = require('jsonwebtoken')
const Boom = require('@hapi/boom')

/**
 * authenticate(request)
 *
 * Replaces the Express authMiddleware.
 * Instead of calling next() it returns the decoded user or throws a Boom error.
 * Call this at the top of any handler that requires authentication.
 *
 * Usage in a Hapi handler:
 *   const user = authenticate(request)   // throws 401 Boom if invalid
 */
function authenticate(request) {
  // Hapi reads cookies via request.state — replaces req.cookies
  const token = request.state?.token

  if (!token) {
    throw Boom.unauthorized('Access denied. Please login.')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded   // caller assigns this to request.user equivalent
  } catch {
    throw Boom.unauthorized('Invalid or expired token.')
  }
}

module.exports = { authenticate }
