'use strict'

const cart             = require('../controllers/cartController')
const { authenticate } = require('../middleware/authMiddleware')

module.exports = [
  { method: 'GET',    path: '/api/cart',                options: { auth: false }, handler: (request, h) => { request.user = authenticate(request); return cart.getCart(request, h) } },
  { method: 'POST',   path: '/api/cart',                options: { auth: false }, handler: (request, h) => { request.user = authenticate(request); return cart.addToCart(request, h) } },
  { method: 'POST',   path: '/api/cart/revalidate',     options: { auth: false }, handler: (request, h) => { request.user = authenticate(request); return cart.revalidateCart(request, h) } },
  { method: 'PUT',    path: '/api/cart/{productId}',    options: { auth: false }, handler: (request, h) => { request.user = authenticate(request); return cart.updateCartItem(request, h) } },
  { method: 'DELETE', path: '/api/cart/{productId}',    options: { auth: false }, handler: (request, h) => { request.user = authenticate(request); return cart.deleteCartItem(request, h) } },
  { method: 'DELETE', path: '/api/cart',                options: { auth: false }, handler: (request, h) => { request.user = authenticate(request); return cart.clearCart(request, h) } },
]
