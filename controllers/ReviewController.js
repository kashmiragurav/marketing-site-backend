const Review = require("../models/Review");
const Product = require("../models/Product");

// ─── GET PRODUCT REVIEWS ─────────────────────────────────────────────
exports.getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;
    
    const filter = { 
      productId: req.params.productId, 
      isActive: true 
    };

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE REVIEW (soft delete) ───────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user owns the review or is admin
    if (review.userId.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    review.isActive = false;
    await review.save();

    // Recalculate product ratings
    const reviews = await Review.find({ productId: review.productId, isActive: true });
    const product = await Product.findById(review.productId);
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      product.ratingsAverage = totalRating / reviews.length;
      product.ratingsCount = reviews.length;
    } else {
      product.ratingsAverage = 0;
      product.ratingsCount = 0;
    }
    
    await product.save();

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
