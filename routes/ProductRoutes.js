'use strict'

const productController = require('../controllers/ProductController')
const { authenticate }  = require('../middleware/authMiddleware')
const requireRole       = require('../middleware/roleMiddleware')
const adapt             = require('../utils/adaptRequest')

function auth(request, ...roles) {
  const user = authenticate(request)
  if (roles.length) requireRole(...roles)(user)
  return user
}

function run(request, h, userFn, controllerFn) {
  const { req, res, next, responsePromise } = adapt(request, h)
  req.user = userFn ? userFn() : null
  controllerFn(req, res, next)
  return responsePromise
}

module.exports = [
  {
    method: 'GET', path: '/api/products', options: { auth: false },
    handler: (request, h) => run(request, h, null, productController.getProducts),
  },
  {
    method: 'GET', path: '/api/products/search', options: { auth: false },
    handler: (request, h) => run(request, h, null, productController.globalSearch),
  },
  {
    method: 'GET', path: '/api/products/admin/deleted', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'super_admin'),
      productController.getDeletedProducts
    ),
  },
  {
    method: 'GET', path: '/api/products/{id}', options: { auth: false },
    handler: (request, h) => run(request, h, null, productController.getProductById),
  },
  {
    method: 'POST', path: '/api/products', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.createProduct
    ),
  },
  {
    method: 'POST', path: '/api/products/bulk', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.bulkCreateProducts
    ),
  },
  {
    method: 'PUT', path: '/api/products/{id}', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.updateProduct
    ),
  },
  {
    method: 'DELETE', path: '/api/products/{id}', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'admin', 'super_admin'),
      productController.deleteProduct
    ),
  },
  {
    method: 'PATCH', path: '/api/products/{id}/restore', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => auth(request, 'super_admin'),
      productController.restoreProduct
    ),
  },
  {
    method: 'POST', path: '/api/products/{id}/rate', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => authenticate(request),
      productController.rateProduct
    ),
  },
  {
    method: 'POST', path: '/api/products/{id}/reviews', options: { auth: false },
    handler: (request, h) => run(request, h,
      () => authenticate(request),
      productController.addReview
    ),
  },
]
