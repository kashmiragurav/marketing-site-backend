'use strict'

const reviewController = require('../controllers/ReviewController')
const { authenticate } = require('../middleware/authMiddleware')
const adapt            = require('../utils/adaptRequest')

module.exports = [
  {
    method: 'GET', path: '/api/reviews/product/{productId}', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      reviewController.getProductReviews(req, res, next)
      return responsePromise
    },
  },
  {
    method: 'DELETE', path: '/api/reviews/{id}', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      reviewController.deleteReview(req, res, next)
      return responsePromise
    },
  },
]
