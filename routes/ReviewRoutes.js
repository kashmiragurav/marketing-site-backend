'use strict'

const review           = require('../controllers/ReviewController')
const { authenticate } = require('../middleware/authMiddleware')

module.exports = [
  { method: 'GET',    path: '/api/reviews/product/{productId}', options: { auth: false }, handler: review.getProductReviews },
  { method: 'DELETE', path: '/api/reviews/{id}',                options: { auth: false }, handler: (request, h) => { request.user = authenticate(request); return review.deleteReview(request, h) } },
]
