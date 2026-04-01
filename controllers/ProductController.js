const Product = require("../models/Product");
const Review = require("../models/Review");


// ─── GET ALL PRODUCTS (cursor-based) ────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const {
      search, category, minPrice, maxPrice, inStock, minRating,
      sortBy = 'createdAt', order = 'desc',
      cursor, limit = 15,
    } = req.query

    const filter = { isActive: { $ne: false } }
    if (search)   filter.title    = { $regex: search,   $options: 'i' }
    if (category) filter.category = { $regex: category, $options: 'i' }
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (inStock === 'true') filter.stock          = { $gt: 0 }
    if (minRating)          filter.ratingsAverage = { $gte: Number(minRating) }

    // Cursor: skip docs before/after the last seen _id
    if (cursor) {
      filter._id = order === 'asc' ? { $gt: cursor } : { $lt: cursor }
    }

    const lim       = Math.min(Number(limit), 50)
    const sortOrder = order === 'asc' ? 1 : -1

    // Fetch lim+1 to detect hasMore without a countDocuments call
    const rows = await Product.find(filter)
      .sort({ [sortBy]: sortOrder, _id: sortOrder })
      .limit(lim + 1)
      .select('title price category image stock brand ratingsAverage ratingsCount createdBy')

    const hasMore    = rows.length > lim
    const products   = hasMore ? rows.slice(0, lim) : rows
    const nextCursor = hasMore ? String(products[products.length - 1]._id) : null

    res.json({ products, nextCursor, hasMore })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}


// ─── GET SINGLE PRODUCT ───────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get reviews for this product
    const reviews = await Review.find({ 
      productId: req.params.id, 
      isActive: true 
    }).populate('userId', 'name email');

    res.json({
      ...product.toObject(),
      reviews
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─── CREATE SINGLE PRODUCT ───────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, image, stock, brand, sku, tags } = req.body

    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' })
    }

    const product = await Product.create({
      title,
      description: description || '',
      price:       Number(price),
      category:    category   || '',
      image:       image      || `https://picsum.photos/seed/${Date.now()}/400/400`,
      stock:       Number(stock) || 0,
      brand:       brand || '',
      sku:         sku   || '',
      tags:        Array.isArray(tags) ? tags : [],
      isActive:    true,
      createdBy:   req.user.userId,
    })

    res.status(201).json({ message: 'Product created', product })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── CREATE PRODUCT ───────────────────────────────────────────────
// Bulk API → insertMany → 1 request → N records
// Auto-assigns a unique picsum image to any product missing one
exports.bulkCreateProducts = async (req, res) => {
  try {
    const body = Array.isArray(req.body) ? req.body : [req.body]

    const prepared = body.map((product, index) => ({
      ...product,
      image: product.image || `https://picsum.photos/seed/${index + Date.now()}/400/400`,
    }))

    const products = await Product.insertMany(prepared)

    res.status(201).json({
      message: "Products added successfully",
      count: products.length,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── UPDATE PRODUCT ───────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ownership check: only owner or admin can update
    const isOwner = String(product.createdBy) === String(req.user.userId)
    const isAdmin = ['admin', 'super_admin'].includes((req.user.role || '').toLowerCase())
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this product" })
    }

    const fields = ['title', 'description', 'price', 'category', 'image', 'stock', 'brand', 'sku', 'tags', 'isActive'];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─── SOFT DELETE (sets isActive: false) ───────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    // Ownership check
    const isOwner = String(product.createdBy) === String(req.user.userId)
    const isAdmin = ['admin', 'super_admin'].includes((req.user.role || '').toLowerCase())
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this product' })
    }

    product.isActive = false
    await product.save()
    res.json({ message: 'Product deactivated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
};


// ─── ADD REVIEW (rating + comment) ─────────────────────────────
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Prevent duplicate review from same user
    const existingReview = await Review.findOne({
      productId: req.params.id,
      userId: req.user.userId,
      isActive: true
    });
    
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Create new review
    const review = new Review({
      productId: req.params.id,
      userId: req.user.userId,
      userName: req.user.email,
      rating: Number(rating),
      comment: comment || "",
    });

    await review.save();

    // Recalculate product ratings
    const reviews = await Review.find({ productId: req.params.id, isActive: true });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratingsAverage = totalRating / reviews.length;
    product.ratingsCount = reviews.length;
    await product.save();

    res.status(201).json({
      message: "Review submitted",
      ratingsAverage: product.ratingsAverage,
      ratingsCount: product.ratingsCount,
      review: review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET INACTIVE PRODUCTS (admin only) ──────────────────────────
exports.getDeletedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: false }).lean()
    res.json({ total: products.length, products })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── RESTORE PRODUCT (admin only) ────────────────────────────────
exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    product.isActive = true
    await product.save()
    res.json({ message: 'Product restored', product })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── RATE PRODUCT ────────────────────────────────────────────────
// Accepts only a rating (1-5). No comment, no review stored.
// Recalculates ratingsAverage and increments ratingsCount.
exports.rateProduct = async (req, res) => {
  try {
    const { rating } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Recalculate average without storing individual reviews
    const currentTotal = product.ratingsAverage * product.ratingsCount
    product.ratingsCount  += 1
    product.ratingsAverage = (currentTotal + Number(rating)) / product.ratingsCount

    await product.save()

    res.json({
      message: 'Rating submitted',
      ratingsAverage: product.ratingsAverage,
      ratingsCount:   product.ratingsCount,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── GLOBAL SEARCH ───────────────────────────────────────────────────
// Search across products, categories, brands, and tags
exports.globalSearch = async (req, res) => {
  try {
    const { 
      q, 
      type = "all", // products, categories, brands, all
      page = 1, 
      limit = 10 
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = { $regex: q.trim(), $options: "i" };
    const skip = (Number(page) - 1) * Number(limit);

    let results = {};

    // Always search in products (for logged-in and non-logged-in users)
    if (type === "all" || type === "products") {
      const productFilter = {
        isActive: { $ne: false },
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
          { brand: searchRegex },
          { category: searchRegex },
          { sku: searchRegex }
        ]
      };

      const products = await Product.find(productFilter)
        .select("title price category image brand ratingsAverage ratingsCount")
        .sort({ ratingsAverage: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Product.countDocuments(productFilter);

      results.products = {
        items: products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };
    }

    // Search categories (distinct values)
    if (type === "all" || type === "categories") {
      const categories = await Product.distinct("category", {
        isActive: { $ne: false },
        category: searchRegex
      });
      results.categories = categories;
    }

    // Search brands (distinct values)
    if (type === "all" || type === "brands") {
      const brands = await Product.distinct("brand", {
        isActive: { $ne: false },
        brand: searchRegex
      });
      results.brands = brands;
    }

    res.json({
      query: q.trim(),
      type,
      results
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};