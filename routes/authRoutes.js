'use strict'

const auth         = require('../controllers/authController')
const { authenticate } = require('../middleware/authMiddleware')
const validate     = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../validations/authValidations')

module.exports = [
  {
    method: 'POST', path: '/api/auth/register', options: { auth: false },
    handler: (request, h) => { validate(registerSchema)(request.payload); return auth.register(request, h) },
  },
  { method: 'GET',  path: '/api/auth/verify-email',        options: { auth: false }, handler: auth.verifyEmail },
  { method: 'POST', path: '/api/auth/resend-verification',  options: { auth: false }, handler: auth.resendVerification },
  {
    method: 'POST', path: '/api/auth/login', options: { auth: false },
    handler: (request, h) => { validate(loginSchema)(request.payload); return auth.login(request, h) },
  },
  { method: 'POST', path: '/api/auth/forgot-password', options: { auth: false }, handler: auth.forgotPassword },
  { method: 'POST', path: '/api/auth/reset-password',  options: { auth: false }, handler: auth.resetPassword },
  {
    method: 'GET', path: '/api/auth/me', options: { auth: false },
    handler: (request, h) => { request.user = authenticate(request); return auth.me(request, h) },
  },
  {
    method: 'GET', path: '/api/auth/users', options: { auth: false },
    handler: (request, h) => { request.user = authenticate(request); return auth.getAllUsers(request, h) },
  },
  { method: 'POST', path: '/api/auth/logout', options: { auth: false }, handler: auth.logout },
]
