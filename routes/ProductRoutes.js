'use strict'

const productController = require('../controllers/ProductController')
const { authenticate }  = require('../middleware/authMiddleware')
const requireRole       = require('../middleware/roleMiddleware')
const adapt             = require('../utils/adaptRequest')

// ── Helper: authenticate + optional role check ───────────────────────────
function auth(request, ...roles) {
  const user = authenticate(request)
  if (roles.length) requireRole(...roles)(user)
  return user
}

// ── Helper: build adapted req/res and attach user ────────────────────────
function run(request, h, userFn, controllerFn) {
  const { req, res } = adapt(request, h)
  req.user = userFn ? userFn() : null
  return controllerFn(req, res)
}

module.exports = [

  // ── Public ───────────────────────────────────────────────────────────────
  {
    method:  'GET',
    path:    '/api/products',
    options: { auth: false },
    handler: (request, h) => run(request, h, null, productController.getProducts),
  },
  {
    method:  'GET',
    path:    '/api/products/search',
    options: { auth: false },
    handler: (request, h) => run(request, h, null, productController.globalSearch),
  },
  // Must be before /{id} to avoid param conflict
  {
    method:  'GET',
    path:    '/api/products/admin/deleted',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'super_admin'),
      productController.getDeletedProducts
    ),
  },
  {
    method:  'GET',
    path:    '/api/products/{id}',
    options: { auth: false },
    handler: (request, h) => run(request, h, null, productController.getProductById),
  },

  // ── Admin + Super Admin ───────────────────────────────────────────────────
  {
    method:  'POST',
    path:    '/api/products',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.createProduct
    ),
  },
  {
    method:  'POST',
    path:    '/api/products/bulk',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.bulkCreateProducts
    ),
  },
  {
    method:  'PUT',
    path:    '/api/products/{id}',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.updateProduct
    ),
  },
  {
    method:  'DELETE',
    path:    '/api/products/{id}',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.deleteProduct
    ),
  },

  // ── Super Admin only ──────────────────────────────────────────────────────
  {
    method:  'PATCH',
    path:    '/api/products/{id}/restore',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'super_admin'),
      productController.restoreProduct
    ),
  },

  // ── Any authenticated user ────────────────────────────────────────────────
  {
    method:  'POST',
    path:    '/api/products/{id}/rate',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => authenticate(request),
      productController.rateProduct
    ),
  },
  {
    method:  'POST',
    path:    '/api/products/{id}/reviews',
    options: { auth: false },
    handler: (request, h) => run(request, h,
      () => authenticate(request),
      productController.addReview
    ),
  },
]
