const Product = require("../models/Product");


// ─── GET ALL PRODUCTS ─────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      products,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─── GET SINGLE PRODUCT ───────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─── CREATE SINGLE PRODUCT ───────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, image, stock } = req.body

    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' })
    }

    const product = await Product.create({
      title,
      description: description || '',
      price:       Number(price),
      category:    category || '',
      image:       image    || `https://picsum.photos/seed/${Date.now()}/400/400`,
      stock:       Number(stock) || 0,
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

    const fields = ["title", "description", "price", "category", "image", "stock"];

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


// ─── DELETE PRODUCT (HARD DELETE) ─────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


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