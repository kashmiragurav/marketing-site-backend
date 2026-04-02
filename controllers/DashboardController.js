'use strict'

const Product = require('../models/Product')

exports.getDashboardStats = async (request, h) => {
  const [total, inStockCount, outOfStock, topRatedCount, topRatedProducts, recentProducts, lowStockProducts] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $gt: 0 } }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    Product.countDocuments({ isActive: true, ratingsAverage: { $gte: 4 } }),
    Product.find({ isActive: true, ratingsAverage: { $gt: 0 }, ratingsCount: { $gt: 0 } })
      .sort({ ratingsAverage: -1, ratingsCount: -1 }).limit(5)
      .select('title price category image stock ratingsAverage ratingsCount').lean(),
    Product.find({ isActive: true })
      .sort({ createdAt: -1 }).limit(6)
      .select('title price category image stock ratingsAverage createdAt').lean(),
    Product.find({ isActive: true, stock: { $gt: 0 } })
      .sort({ stock: 1 }).limit(5)
      .select('title price category image stock ratingsAverage ratingsCount').lean(),
  ])

  const stockRate = total > 0 ? Math.round((inStockCount / total) * 100) : 0

  return h.response({ total, inStock: inStockCount, outOfStock, topRated: topRatedCount, stockRate, topRatedProducts, recentProducts, lowStockProducts }).code(200)
}
