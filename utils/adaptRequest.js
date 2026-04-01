'use strict'

const Boom = require('@hapi/boom')

/**
 * adaptRequest(request, h)
 *
 * Maps Hapi request/h to Express-style req/res/next.
 *
 * Key fixes:
 *  1. next(err) — controllers call next(err) in catch blocks.
 *     We reject the responsePromise with a Boom error so Hapi's
 *     onPreResponse extension handles it correctly.
 *  2. Double-resolve guard — some controllers call res.json() AND
 *     next(err) in different code paths. Only the first call wins.
 *  3. responsePromise — always returned by the Hapi handler so Hapi
 *     never sees "handler did not return a value".
 */
function adaptRequest(request, h) {
  let _settled = false   // guard: only resolve/reject once

  let _resolve
  let _reject
  const responsePromise = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject  = reject
  })

  // ── req ───────────────────────────────────────────────────────────────────
  const req = {
    body:    request.payload || {},
    params:  request.params  || {},
    query:   request.query   || {},
    cookies: request.state   || {},
    headers: request.headers || {},
    user:    request.user    || null,
  }

  // ── res ───────────────────────────────────────────────────────────────────
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
      if (_settled) return   // guard against double-resolve
      _settled = true

      let response = h.response(body).code(_status)
      Object.entries(_headers).forEach(([k, v]) => { response = response.header(k, v) })

      if (res._cookieName) {
        response = response.state(res._cookieName, res._cookieValue, {
          ttl:        res._cookieOptions.maxAge  || null,
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

      _resolve(response)
      return response
    },
    send(body) {
      return res.json(body)
    },
  }

  // ── next — called by controllers in catch blocks: next(err) ───────────────
  // Converts the Express error into a Boom error and rejects the promise
  // so Hapi's onPreResponse extension formats it correctly.
  function next(err) {
    if (_settled) return   // guard against double-resolve
    _settled = true

    if (err) {
      const status  = err.status || err.statusCode || 500
      const boomErr = Boom.boomify(err instanceof Error ? err : new Error(String(err)), { statusCode: status })
      _reject(boomErr)
    } else {
      // next() called without error — nothing to send, resolve with empty 200
      _resolve(h.response().code(200))
    }
  }

  return { req, res, next, responsePromise }
}

module.exports = adaptRequest
