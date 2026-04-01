'use strict'

const {
  register, verifyEmail, login, forgotPassword,
  resendVerification, resetPassword, getAllUsers, me,
} = require('../controllers/authController')

const { authenticate } = require('../middleware/authMiddleware')
const validate         = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../validations/authValidations')
const adapt            = require('../utils/adaptRequest')

module.exports = [

  {
    method:  'POST',
    path:    '/api/auth/register',
    options: { auth: false },
    handler: (request, h) => {
      validate(registerSchema)(request.payload)
      const { req, res } = adapt(request, h)
      return register(req, res)
    },
  },
  {
    method:  'GET',
    path:    '/api/auth/verify-email',
    options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      return verifyEmail(req, res)
    },
  },
  {
    method:  'POST',
    path:    '/api/auth/resend-verification',
    options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      return resendVerification(req, res)
    },
  },
  {
    method:  'POST',
    path:    '/api/auth/login',
    options: { auth: false },
    handler: (request, h) => {
      validate(loginSchema)(request.payload)
      const { req, res } = adapt(request, h)
      return login(req, res)
    },
  },
  {
    method:  'POST',
    path:    '/api/auth/forgot-password',
    options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      return forgotPassword(req, res)
    },
  },
  {
    method:  'POST',
    path:    '/api/auth/reset-password',
    options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      return resetPassword(req, res)
    },
  },
  {
    method:  'GET',
    path:    '/api/auth/me',
    options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return me(req, res)
    },
  },
  {
    method:  'GET',
    path:    '/api/auth/users',
    options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return getAllUsers(req, res)
    },
  },
  {
    method:  'POST',
    path:    '/api/auth/logout',
    options: { auth: false },
    handler: (request, h) => {
      return h.response({ message: 'Logged out successfully' }).unstate('token').code(200)
    },
  },
]
