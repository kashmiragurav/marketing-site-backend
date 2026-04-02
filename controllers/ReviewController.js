'use strict'

const Boom    = require('@hapi/boom')
const Review  = require('../models/Review')
const Product = require('../models/Product')

exports.getProductReviews = async (request, h) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = request.query
  const filter    = { productId: request.params.productId, isActive: true }
  const sortOrder = order === 'asc' ? 1 : -1
  const skip      = (Number(page) - 1) * Number(limit)

  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).populate('userId', 'name email').sort({ [sortBy]: sortOrder }).skip(skip).limit(Number(limit)),
  ])

  return h.response({ reviews, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } }).code(200)
}

exports.deleteReview = async (request, h) => {
  const review = await Review.findById(request.params.id)
  if (!review) throw Boom.notFound('Review not found')

  if (review.userId.toString() !== request.user.userId && request.user.role !== 'admin') {
    throw Boom.forbidden('Not authorized to delete this review')
  }

  review.isActive = false
  await review.save()

  const reviews = await Review.find({ productId: review.productId, isActive: true })
  const product = await Product.findById(review.productId)
  if (reviews.length > 0) {
    product.ratingsAverage = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    product.ratingsCount   = reviews.length
  } else {
    product.ratingsAverage = 0
    product.ratingsCount   = 0
  }
  await product.save()

  return h.response({ message: 'Review deleted successfully' }).code(200)
}
