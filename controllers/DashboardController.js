const Product = require('../models/Product')

// GET /api/dashboard/stats
// Returns flat shape the frontend reads directly:
// { total, inStock, outOfStock, topRated, stockRate,
//   topRatedProducts, recentProducts, lowStockProducts }
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      total,
      inStockCount,
      outOfStock,
      topRatedCount,
      topRatedProducts,
      recentProducts,
      lowStockProducts,
    ] = await Promise.all([

      // total active products
      Product.countDocuments({ isActive: true }),

      // in stock (stock > 0)
      Product.countDocuments({ isActive: true, stock: { $gt: 0 } }),

      // out of stock
      Product.countDocuments({ isActive: true, stock: 0 }),

      // rated >= 4 stars
      Product.countDocuments({ isActive: true, ratingsAverage: { $gte: 4 } }),

      // top 5 by rating — only products with actual ratings, empty if none
      Product.find({ isActive: true, ratingsAverage: { $gt: 0 }, ratingsCount: { $gt: 0 } })
        .sort({ ratingsAverage: -1, ratingsCount: -1 })
        .limit(5)
        .select('title price category image stock ratingsAverage ratingsCount')
        .lean(),

      // 6 most recently added
      Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title price category image stock ratingsAverage createdAt')
        .lean(),

      // 5 lowest stock still in stock
      Product.find({ isActive: true, stock: { $gt: 0 } })
        .sort({ stock: 1 })
        .limit(5)
        .select('title price category image stock ratingsAverage ratingsCount')
        .lean(),
    ])

    const stockRate = total > 0 ? Math.round((inStockCount / total) * 100) : 0

    res.json({
      total,
      inStock:    inStockCount,
      outOfStock,
      topRated:   topRatedCount,
      stockRate,
      topRatedProducts,
      recentProducts,
      lowStockProducts,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
