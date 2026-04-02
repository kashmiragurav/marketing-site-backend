'use strict'

const Product = require('../models/Product')

exports.getReportSummary = async (request, h) => {
  const filter = { isActive: { $ne: false } }

  const [totalDocs, avgPriceAgg, inventoryValueAgg] = await Promise.all([
    Product.countDocuments(filter),
    Product.aggregate([{ $match: filter }, { $group: { _id: null, avg: { $avg: '$price' } } }]),
    Product.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$stock'] } } } }]),
  ])

  const total               = totalDocs
  const avgPrice            = avgPriceAgg[0]?.avg         != null ? Math.round(avgPriceAgg[0].avg)         : 0
  const totalInventoryValue = inventoryValueAgg[0]?.total != null ? Math.round(inventoryValueAgg[0].total) : 0

  const catAgg     = await Product.aggregate([{ $match: filter }, { $group: { _id: { $ifNull: ['$category', ''] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }])
  const categories = catAgg.map(c => ({ name: c._id || 'Uncategorised', count: c.count }))

  const priceBuckets = await Product.aggregate([
    { $match: filter },
    { $bucket: { groupBy: '$price', boundaries: [0, 500, 2000, 5000, Infinity], default: 'Other', output: { count: { $sum: 1 } } } },
  ])
  const bucketLabel = b => ({ 0: 'Under ₹500', 500: '₹500 – ₹2,000', 2000: '₹2,000 – ₹5,000', 5000: 'Over ₹5,000' }[b] || 'Other')
  const priceBucketsFormatted = priceBuckets.map(b => ({ range: bucketLabel(b._id), count: b.count }))

  const ratingAgg = await Product.aggregate([
    { $match: filter },
    { $bucket: { groupBy: '$ratingsAverage', boundaries: [0.1, 1, 2, 3, 4, 5.01], default: 'Unrated', output: { count: { $sum: 1 } } } },
  ])
  const ratingLabel = b => ({ Unrated: 'Unrated', 0.1: '1★', 1: '1–2★', 2: '2–3★', 3: '3–4★', 4: '4–5★' }[b] || String(b))
  const ratingBuckets = ratingAgg.map(b => ({ label: ratingLabel(b._id), count: b.count }))

  const topByPrice = await Product.find(filter).sort({ price: -1 }).limit(5).select('_id title category price')

  return h.response({ total, avgPrice, totalInventoryValue, categories, priceBuckets: priceBucketsFormatted, ratingBuckets, topByPrice }).code(200)
}
