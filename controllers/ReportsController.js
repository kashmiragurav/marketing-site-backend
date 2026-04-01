const Product = require('../models/Product')

// GET /api/reports/summary
// Returns aggregated catalog analytics — zero computation on the frontend
exports.getReportSummary = async (req, res) => {
  try {
    const filter = { isActive: { $ne: false } }

    // ── Scalar KPIs ──────────────────────────────────────────────────────────
    const [totalDocs, avgPriceAgg, inventoryValueAgg] = await Promise.all([
      Product.countDocuments(filter),

      Product.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$price' } } },
      ]),

      Product.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$stock'] } } } },
      ]),
    ])

    const total               = totalDocs
    const avgPrice            = avgPriceAgg[0]?.avg            != null ? Math.round(avgPriceAgg[0].avg)            : 0
    const totalInventoryValue = inventoryValueAgg[0]?.total    != null ? Math.round(inventoryValueAgg[0].total)    : 0

    // ── Products by Category ─────────────────────────────────────────────────
    const catAgg = await Product.aggregate([
      { $match: filter },
      { $group: { _id: { $ifNull: ['$category', ''] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    const categories = catAgg.map(c => ({ name: c._id || 'Uncategorised', count: c.count }))

    // ── Price Distribution ───────────────────────────────────────────────────
    const priceBuckets = await Product.aggregate([
      { $match: filter },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 500, 2000, 5000, Infinity],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ])

    const bucketLabel = boundary => {
      if (boundary === 0)        return 'Under ₹500'
      if (boundary === 500)      return '₹500 – ₹2,000'
      if (boundary === 2000)     return '₹2,000 – ₹5,000'
      if (boundary === 5000)     return 'Over ₹5,000'
      return 'Other'
    }
    const priceBucketsFormatted = priceBuckets.map(b => ({
      range: bucketLabel(b._id),
      count: b.count,
    }))

    // ── Rating Distribution ──────────────────────────────────────────────────
    const ratingAgg = await Product.aggregate([
      { $match: filter },
      {
        $bucket: {
          groupBy: '$ratingsAverage',
          boundaries: [0.1, 1, 2, 3, 4, 5.01],
          default: 'Unrated',
          output: { count: { $sum: 1 } },
        },
      },
    ])

    const ratingLabel = boundary => {
      if (boundary === 'Unrated') return 'Unrated'
      if (boundary === 0.1)       return '1★'
      if (boundary === 1)         return '1–2★'
      if (boundary === 2)         return '2–3★'
      if (boundary === 3)         return '3–4★'
      if (boundary === 4)         return '4–5★'
      return String(boundary)
    }
    const ratingBuckets = ratingAgg.map(b => ({
      label: ratingLabel(b._id),
      count: b.count,
    }))

    // ── Top by Price ─────────────────────────────────────────────────────────
    const topByPrice = await Product.find(filter)
      .sort({ price: -1 })
      .limit(5)
      .select('_id title category price')

    res.json({
      total,
      avgPrice,
      totalInventoryValue,
      categories,
      priceBuckets: priceBucketsFormatted,
      ratingBuckets,
      topByPrice,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
