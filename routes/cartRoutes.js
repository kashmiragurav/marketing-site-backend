'use strict'

const cartController   = require('../controllers/cartController')
const { authenticate } = require('../middleware/authMiddleware')
const adapt            = require('../utils/adaptRequest')

module.exports = [
  {
    method: 'GET', path: '/api/cart', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      cartController.getCart(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'POST', path: '/api/cart', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      cartController.addToCart(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'POST', path: '/api/cart/revalidate', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      cartController.revalidateCart(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'PUT', path: '/api/cart/{productId}', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      cartController.updateCartItem(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'DELETE', path: '/api/cart/{productId}', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      cartController.deleteCartItem(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'DELETE', path: '/api/cart', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      cartController.clearCart(req, res, next)
      return responsePromise
    },
  },
]
