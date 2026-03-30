const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
  isActive: { type: Boolean, default: true }, // for soft delete of reviews
}, { timestamps: true });

// Index for better query performance
reviewSchema.index({ productId: 1, isActive: 1 });
reviewSchema.index({ userId: 1 });

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
