'use strict'

const productController = require('../controllers/ProductController')
const { authenticate }  = require('../middleware/authMiddleware')
const requireRole       = require('../middleware/roleMiddleware')

function auth(request, ...roles) {
  const user = authenticate(request)
  if (roles.length) requireRole(...roles)(user)
  request.user = user
}

module.exports = [
  // ── Public ───────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/api/products',              options: { auth: false }, handler: productController.getProducts },
  { method: 'GET',   path: '/api/products/search',       options: { auth: false }, handler: productController.globalSearch },
  { method: 'GET',   path: '/api/products/{id}',         options: { auth: false }, handler: productController.getProductById },

  // ── Super Admin only ──────────────────────────────────────────────────────
  {
    method: 'GET', path: '/api/products/admin/deleted', options: { auth: false },
    handler: (request, h) => { auth(request, 'super_admin'); return productController.getDeletedProducts(request, h) },
  },
  {
    method: 'PATCH', path: '/api/products/{id}/restore', options: { auth: false },
    handler: (request, h) => { auth(request, 'super_admin'); return productController.restoreProduct(request, h) },
  },

  // ── Admin + Super Admin ───────────────────────────────────────────────────
  {
    method: 'POST', path: '/api/products', options: { auth: false },
    handler: (request, h) => { auth(request, 'admin', 'super_admin'); return productController.createProduct(request, h) },
  },
  {
    method: 'POST', path: '/api/products/bulk', options: { auth: false },
    handler: (request, h) => { auth(request, 'admin', 'super_admin'); return productController.bulkCreateProducts(request, h) },
  },
  {
    method: 'PUT', path: '/api/products/{id}', options: { auth: false },
    handler: (request, h) => { auth(request, 'admin', 'super_admin'); return productController.updateProduct(request, h) },
  },
  {
    method: 'DELETE', path: '/api/products/{id}', options: { auth: false },
    handler: (request, h) => { auth(request, 'admin', 'super_admin'); return productController.deleteProduct(request, h) },
  },

  // ── Any authenticated user ────────────────────────────────────────────────
  {
    method: 'POST', path: '/api/products/{id}/rate', options: { auth: false },
    handler: (request, h) => { request.user = authenticate(request); return productController.rateProduct(request, h) },
  },
  {
    method: 'POST', path: '/api/products/{id}/reviews', options: { auth: false },
    handler: (request, h) => { request.user = authenticate(request); return productController.addReview(request, h) },
  },
]
