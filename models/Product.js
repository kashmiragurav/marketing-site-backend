const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating:   { type: Number, min: 1, max: 5, required: true },
  comment:  { type: String, default: "" },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: "" },
  price:          { type: Number, required: true },
  category:       { type: String, default: "" },
  image:          { type: String, default: "" },
  stock:          { type: Number, default: 0 },
  ratingsAverage: { type: Number, default: 0 },
  ratingsCount:   { type: Number, default: 0 },
  reviews:        [reviewSchema],
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
