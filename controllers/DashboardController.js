const Product = require("../models/Product");
const User = require("../models/User");

// ─── GET DASHBOARD STATISTICS ─────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = totalProducts - activeProducts;
    const lowStockProducts = await Product.countDocuments({ 
      isActive: true, 
      stock: { $gt: 0, $lt: 5 } 
    });
    const outOfStockProducts = await Product.countDocuments({ 
      isActive: true, 
      stock: 0 
    });

    // Calculate total inventory value
    const products = await Product.find({ isActive: true }).select('price stock');
    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (product.price * product.stock);
    }, 0);

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const vendorUsers = await User.countDocuments({ role: 'vendor' });
    const customerUsers = await User.countDocuments({ role: 'customer' });

    // Get recent products (last 6)
    const recentProducts = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title price category image stock ratingsAverage createdAt');

    // Get top rated products (top 4)
    const topRatedProducts = await Product.find({ 
      isActive: true, 
      ratingsCount: { $gt: 0 } 
    })
      .sort({ ratingsAverage: -1, ratingsCount: -1 })
      .limit(4)
      .select('title price category image ratingsAverage ratingsCount');

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        totalValue: totalInventoryValue,
        byCategory: productsByCategory
      },
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
        admin: adminUsers,
        vendor: vendorUsers,
        customer: customerUsers
      },
      recentProducts,
      topRatedProducts
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
