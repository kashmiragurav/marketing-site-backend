'use strict'

const cartController   = require('../controllers/cartController')
const { authenticate } = require('../middleware/authMiddleware')
const adapt            = require('../utils/adaptRequest')

module.exports = [
  {
    method: 'GET', path: '/api/cart', options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return cartController.getCart(req, res)
    },
  },
  {
    method: 'POST', path: '/api/cart', options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return cartController.addToCart(req, res)
    },
  },
  {
    method: 'POST', path: '/api/cart/revalidate', options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return cartController.revalidateCart(req, res)
    },
  },
  {
    method: 'PUT', path: '/api/cart/{productId}', options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return cartController.updateCartItem(req, res)
    },
  },
  {
    method: 'DELETE', path: '/api/cart/{productId}', options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return cartController.deleteCartItem(req, res)
    },
  },
  {
    method: 'DELETE', path: '/api/cart', options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return cartController.clearCart(req, res)
    },
  },
]
