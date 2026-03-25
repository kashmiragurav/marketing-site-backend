const mongoose = require("mongoose");

// Simple Review Schema
const reviewSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String },
  rating:   { type: Number, min: 1, max: 5 },
}, { timestamps: true });

// Simple Product Schema
const productSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  price:       { type: Number, required: true },
  category:    { type: String },

  image:       { type: String },

  // Simple stock
  stock:       { type: Number, default: 0 },

  // Ratings
  ratingsAverage: { type: Number, default: 0 },
  ratingsCount:   { type: Number, default: 0 },


}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);