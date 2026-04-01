'use strict'

const Boom = require('@hapi/boom')

/**
 * validate(schema)(payload)
 *
 * Replaces the Express validate middleware.
 * Takes the request payload directly and throws Boom.badRequest on failure.
 *
 * Usage in a Hapi handler:
 *   validate(registerSchema)(request.payload)
 */
const validate = (schema) => (payload) => {
  const { error } = schema.validate(payload)
  if (error) throw Boom.badRequest(error.details[0].message)
}

module.exports = validate
