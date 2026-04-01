const mongoose = require("mongoose");
const { CATEGORY_ENUM } = require("../constants");

const productSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  price:          { type: Number, required: true },
  category:       { type: String, enum: [...CATEGORY_ENUM, ''], default: '' },
  image:          { type: String, default: '' },
  stock:          { type: Number, default: 0, min: 0 },
  tags:           [{ type: String }],
  brand:          { type: String, default: '' },
  sku:            { type: String, default: '' },
  ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
  ratingsCount:   { type: Number, default: 0, min: 0 },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
