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
    method: 'POST', path: '/api/auth/register', options: { auth: false },
    handler: (request, h) => {
      validate(registerSchema)(request.payload)
      const { req, res, next, responsePromise } = adapt(request, h)
      register(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'GET', path: '/api/auth/verify-email', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      verifyEmail(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'POST', path: '/api/auth/resend-verification', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      resendVerification(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'POST', path: '/api/auth/login', options: { auth: false },
    handler: (request, h) => {
      validate(loginSchema)(request.payload)
      const { req, res, next, responsePromise } = adapt(request, h)
      login(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'POST', path: '/api/auth/forgot-password', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      forgotPassword(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'POST', path: '/api/auth/reset-password', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      resetPassword(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'GET', path: '/api/auth/me', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      me(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'GET', path: '/api/auth/users', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      getAllUsers(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'POST', path: '/api/auth/logout', options: { auth: false },
    handler: (request, h) => {
      return h.response({ message: 'Logged out successfully' }).unstate('token').code(200)
    },
  },
]
