'use strict'

const Boom = require('@hapi/boom')

/**
 * requireRole(...roles)(user)
 *
 * Replaces the Express requireRole middleware.
 * Instead of (req, res, next) it takes the already-decoded user object
 * and throws a Boom.forbidden if the role is not allowed.
 *
 * Usage in a Hapi handler:
 *   const user = authenticate(request)
 *   requireRole('admin', 'super_admin')(user)
 */
function requireRole(...roles) {
  return (user) => {
    if (!user) {
      throw Boom.unauthorized('Not authenticated.')
    }
    const userRole = (user.role || '').toLowerCase()
    const allowed  = roles.map(r => r.toLowerCase())
    if (!allowed.includes(userRole)) {
      throw Boom.forbidden(`Access denied. Required: ${roles.join(' or ')}`)
    }
    // No return value needed — if we reach here the role is valid
  }
}

module.exports = requireRole
module.exports.authorizeRoles = requireRole  // named alias preserved
