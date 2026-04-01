'use strict'

/**
 * adaptRequest(request, h)
 *
 * Maps Hapi's request/h objects to Express-style req/res so that every
 * existing controller can be called without any changes.
 *
 * Usage inside a Hapi handler:
 *   const { req, res } = adaptRequest(request, h)
 *   return someExpressController(req, res)
 *
 * The returned `res` object collects the status code, headers, and body
 * then returns a proper Hapi response when res.json() or res.send() is called.
 */
function adaptRequest(request, h) {
  // ── req — Express-compatible request object ──────────────────────────────
  const req = {
    body:    request.payload  || {},
    params:  request.params   || {},
    query:   request.query    || {},
    cookies: request.state    || {},
    headers: request.headers  || {},
    user:    request.user     || null,   // set by auth helpers before calling controller
  }

  // ── res — Express-compatible response builder ────────────────────────────
  let _status  = 200
  let _headers = {}

  const res = {
    status(code) {
      _status = code
      return res
    },
    set(key, value) {
      _headers[key] = value
      return res
    },
    cookie(name, value, options = {}) {
      // Map Express cookie options to Hapi state options
      // The actual cookie is set on the Hapi response in json()/send()
      res._cookieName    = name
      res._cookieValue   = value
      res._cookieOptions = options
      return res
    },
    clearCookie(name) {
      res._clearCookie = name
      return res
    },
    json(body) {
      let response = h.response(body).code(_status)
      Object.entries(_headers).forEach(([k, v]) => { response = response.header(k, v) })
      if (res._cookieName) {
        response = response.state(res._cookieName, res._cookieValue, {
          ttl:        res._cookieOptions.maxAge ? res._cookieOptions.maxAge : null,
          isSecure:   res._cookieOptions.secure   ?? false,
          isHttpOnly: res._cookieOptions.httpOnly ?? true,
          isSameSite: res._cookieOptions.sameSite ?? 'Lax',
          path:       res._cookieOptions.path     ?? '/',
          encoding:   'none',
        })
      }
      if (res._clearCookie) {
        response = response.unstate(res._clearCookie)
      }
      return response
    },
    send(body) {
      return res.json(body)
    },
  }

  return { req, res }
}

module.exports = adaptRequest
