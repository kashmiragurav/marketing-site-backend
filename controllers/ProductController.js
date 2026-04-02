'use strict'

const Boom    = require('@hapi/boom')
const Product = require('../models/Product')
const Review  = require('../models/Review')

// ─── GET ALL PRODUCTS (cursor-based) ─────────────────────────────
exports.getProducts = async (request, h) => {
  const {
    search, category, minPrice, maxPrice, inStock, minRating,
    sortBy = 'createdAt', order = 'desc',
    cursor, limit = 15,
  } = request.query

  const sortOrder = order === 'asc' ? 1 : -1
  const lim       = Math.min(Number(limit), 50)

  const baseFilter = { isActive: true }
  if (search) {
    baseFilter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ]
  }
  if (category)           baseFilter.category      = category
  if (minPrice || maxPrice) {
    baseFilter.price = {}
    if (minPrice) baseFilter.price.$gte = Number(minPrice)
    if (maxPrice) baseFilter.price.$lte = Number(maxPrice)
  }
  if (inStock === 'true') baseFilter.stock          = { $gt: 0 }
  if (minRating)          baseFilter.ratingsAverage = { $gte: Number(minRating) }

  const filter = { ...baseFilter }
  const idOp   = sortOrder === -1 ? '$lt' : '$gt'

  if (cursor) {
    if (sortBy === 'createdAt' || sortBy === '_id') {
      filter._id = { [idOp]: cursor }
    } else {
      const pivot = await Product.findById(cursor).select(sortBy).lean()
      if (pivot) {
        const val        = pivot[sortBy]
        const op         = sortOrder === -1 ? '$lt' : '$gt'
        const cursorCond = {
          $or: [
            { [sortBy]: { [op]: val } },
            { [sortBy]: val, _id: { [idOp]: cursor } },
          ],
        }
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, cursorCond]
          delete filter.$or
        } else {
          Object.assign(filter, cursorCond)
        }
      }
    }
  }

  const [total, rows] = await Promise.all([
    Product.countDocuments(baseFilter),
    Product.find(filter)
      .sort({ [sortBy]: sortOrder, _id: sortOrder })
      .limit(lim + 1)
      .select('title price category image stock brand ratingsAverage ratingsCount createdBy')
      .lean(),
  ])

  const hasMore    = rows.length > lim
  const products   = hasMore ? rows.slice(0, lim) : rows
  const nextCursor = hasMore ? String(products[products.length - 1]._id) : null

  return h.response({ products, nextCursor, hasMore, total }).code(200)
}

// ─── GET SINGLE PRODUCT ──────────────────────────────────────────
exports.getProductById = async (request, h) => {
  const product = await Product.findById(request.params.id)
  if (!product) throw Boom.notFound('Product not found')

  const reviews = await Review.find({ productId: request.params.id, isActive: true })
    .populate('userId', 'name email')

  return h.response({ ...product.toObject(), reviews }).code(200)
}

// ─── CREATE PRODUCT ──────────────────────────────────────────────
exports.createProduct = async (request, h) => {
  const { title, description, price, category, image, stock, brand, sku, tags } = request.payload || {}

  if (!title || price === undefined) throw Boom.badRequest('Title and price are required')

  const product = await Product.create({
    title,
    description: description || '',
    price:       Number(price),
    category:    category || '',
    image:       image    || `https://picsum.photos/seed/${Date.now()}/400/400`,
    stock:       Number(stock) || 0,
    brand:       brand || '',
    sku:         sku   || '',
    tags:        Array.isArray(tags) ? tags : [],
    isActive:    true,
    createdBy:   request.user.userId,
  })

  return h.response({ message: 'Product created', product }).code(201)
}

// ─── BULK CREATE ─────────────────────────────────────────────────
exports.bulkCreateProducts = async (request, h) => {
  const body     = Array.isArray(request.payload) ? request.payload : [request.payload]
  const prepared = body.map((p, i) => ({
    ...p,
    image: p.image || `https://picsum.photos/seed/${i + Date.now()}/400/400`,
  }))
  const products = await Product.insertMany(prepared)
  return h.response({ message: 'Products added successfully', count: products.length }).code(201)
}

// ─── UPDATE PRODUCT ──────────────────────────────────────────────
exports.updateProduct = async (request, h) => {
  const product = await Product.findById(request.params.id)
  if (!product) throw Boom.notFound('Product not found')

  const isOwner      = String(product.createdBy) === String(request.user.userId)
  const isSuperAdmin = (request.user.role || '').toLowerCase() === 'super_admin'
  if (!isOwner && !isSuperAdmin) throw Boom.forbidden('Not authorized to update this product')

  const fields = ['title', 'description', 'price', 'category', 'image', 'stock', 'brand', 'sku', 'tags', 'isActive']
  fields.forEach(f => { if (request.payload?.[f] !== undefined) product[f] = request.payload[f] })
  await product.save()

  return h.response({ message: 'Product updated successfully', product }).code(200)
}

// ─── SOFT DELETE ─────────────────────────────────────────────────
exports.deleteProduct = async (request, h) => {
  const product = await Product.findById(request.params.id)
  if (!product) throw Boom.notFound('Product not found')

  const isOwner      = String(product.createdBy) === String(request.user.userId)
  const isSuperAdmin = (request.user.role || '').toLowerCase() === 'super_admin'
  if (!isOwner && !isSuperAdmin) throw Boom.forbidden('Not authorized to delete this product')

  product.isActive = false
  await product.save()
  return h.response({ message: 'Product deactivated' }).code(200)
}

// ─── GET DELETED (super_admin) ───────────────────────────────────
exports.getDeletedProducts = async (request, h) => {
  const products = await Product.find({ isActive: false }).lean()
  return h.response({ total: products.length, products }).code(200)
}

// ─── RESTORE ─────────────────────────────────────────────────────
exports.restoreProduct = async (request, h) => {
  const product = await Product.findById(request.params.id)
  if (!product) throw Boom.notFound('Product not found')
  product.isActive = true
  await product.save()
  return h.response({ message: 'Product restored', product }).code(200)
}

// ─── RATE PRODUCT ────────────────────────────────────────────────
exports.rateProduct = async (request, h) => {
  const { rating } = request.payload || {}
  if (!rating || rating < 1 || rating > 5) throw Boom.badRequest('Rating must be between 1 and 5')

  const product = await Product.findById(request.params.id)
  if (!product) throw Boom.notFound('Product not found')

  const currentTotal     = product.ratingsAverage * product.ratingsCount
  product.ratingsCount  += 1
  product.ratingsAverage = (currentTotal + Number(rating)) / product.ratingsCount
  await product.save()

  return h.response({ message: 'Rating submitted', ratingsAverage: product.ratingsAverage, ratingsCount: product.ratingsCount }).code(200)
}

// ─── ADD REVIEW ──────────────────────────────────────────────────
exports.addReview = async (request, h) => {
  const { rating, comment } = request.payload || {}
  if (!rating || rating < 1 || rating > 5) throw Boom.badRequest('Rating must be between 1 and 5')

  const product = await Product.findById(request.params.id)
  if (!product) throw Boom.notFound('Product not found')

  const existing = await Review.findOne({ productId: request.params.id, userId: request.user.userId, isActive: true })
  if (existing) throw Boom.badRequest('You have already reviewed this product')

  const review = await Review.create({
    productId: request.params.id,
    userId:    request.user.userId,
    userName:  request.user.email,
    rating:    Number(rating),
    comment:   comment || '',
  })

  const reviews     = await Review.find({ productId: request.params.id, isActive: true })
  const totalRating = reviews.reduce((s, r) => s + r.rating, 0)
  product.ratingsAverage = totalRating / reviews.length
  product.ratingsCount   = reviews.length
  await product.save()

  return h.response({ message: 'Review submitted', ratingsAverage: product.ratingsAverage, ratingsCount: product.ratingsCount, review }).code(201)
}

// ─── GLOBAL SEARCH ───────────────────────────────────────────────
exports.globalSearch = async (request, h) => {
  const { q, type = 'all', page = 1, limit = 10 } = request.query
  if (!q || !q.trim()) throw Boom.badRequest('Search query is required')

  const searchRegex = { $regex: q.trim(), $options: 'i' }
  const skip        = (Number(page) - 1) * Number(limit)
  const results     = {}

  if (type === 'all' || type === 'products') {
    const productFilter = {
      isActive: { $ne: false },
      $or: [{ title: searchRegex }, { description: searchRegex }, { brand: searchRegex }, { category: searchRegex }, { sku: searchRegex }],
    }
    const [products, total] = await Promise.all([
      Product.find(productFilter).select('title price category image brand ratingsAverage ratingsCount').sort({ ratingsAverage: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(productFilter),
    ])
    results.products = { items: products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } }
  }

  if (type === 'all' || type === 'categories') {
    results.categories = await Product.distinct('category', { isActive: { $ne: false }, category: searchRegex })
  }
  if (type === 'all' || type === 'brands') {
    results.brands = await Product.distinct('brand', { isActive: { $ne: false }, brand: searchRegex })
  }

  return h.response({ query: q.trim(), type, results }).code(200)
}
