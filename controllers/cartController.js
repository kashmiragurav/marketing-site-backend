const mongoose = require('mongoose')
const Cart    = require('../models/Cart')
const Product = require('../models/Product')

// ── helper: shape cart items for frontend ─────────────────────────
function shapeItems(cart) {
  return cart.items.map(item => ({
    _id:      item._id,
    quantity: item.quantity,
    product:  item.productId,   // populated
  }))
}

// ── GET /api/cart ─────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart
      .findOne({ userId: req.user.userId })
      .populate('items.productId', 'title price image stock isActive')

    if (!cart) return res.json({ items: [], total: 0 })

    const items = shapeItems(cart)
    const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)
    res.json({ items, total })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── POST /api/cart ────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body
    if (!productId) return res.status(400).json({ message: 'productId is required.' })

    // ── Stock validation ──────────────────────────────────────────
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    if (!product.isActive) return res.status(400).json({ message: 'Product is no longer available.' })
    if (product.stock === 0) {
      return res.status(400).json({
        success: false,
        message: 'This product is out of stock.',
        availableStock: 0,
      })
    }

    let cart = await Cart.findOne({ userId: req.user.userId })

    if (!cart) {
      const safeQty = Math.min(Number(quantity), product.stock)
      cart = await Cart.create({ userId: req.user.userId, items: [{ productId, quantity: safeQty }] })
    } else {
      const existing = cart.items.find(i => i.productId.toString() === productId)

      if (existing) {
        const newQty = existing.quantity + Number(quantity)
        if (newQty > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} item${product.stock === 1 ? '' : 's'} available in stock.`,
            availableStock: product.stock,
          })
        }
        existing.quantity = newQty
      } else {
        const safeQty = Math.min(Number(quantity), product.stock)
        cart.items.push({ productId, quantity: safeQty })
      }
      await cart.save()
    }

    res.status(201).json({ success: true, message: 'Added to cart.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── PUT /api/cart/:id ─────────────────────────────────────────────
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1.' })
    }

    const cart = await Cart
      .findOne({ userId: req.user.userId })
      .populate('items.productId', 'stock title')

    if (!cart) return res.status(404).json({ message: 'Cart not found.' })

    const item = cart.items.find(i => i._id.toString() === req.params.productId)
    if (!item) return res.status(404).json({ message: 'Item not found in cart.' })

    // ── Stock validation ──────────────────────────────────────────
    const stock = item.productId?.stock ?? 0
    if (Number(quantity) > stock) {
      // auto-correct to max available instead of hard reject
      item.quantity = stock
      await cart.save()
      return res.status(400).json({
        success: false,
        message: `Only ${stock} item${stock === 1 ? '' : 's'} available in stock. Quantity adjusted.`,
        availableStock: stock,
        correctedQty: stock,
      })
    }

    item.quantity = Number(quantity)
    await cart.save()
    res.json({ success: true, message: 'Quantity updated.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── DELETE /api/cart/:id ──────────────────────────────────────────
exports.deleteCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId })
    if (!cart) return res.status(404).json({ message: 'Cart not found.' })

    const before = cart.items.length
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.productId)
    if (cart.items.length === before) {
      return res.status(404).json({ message: 'Item not found in cart.' })
    }

    await cart.save()
    res.json({ message: 'Item removed.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── DELETE /api/cart ──────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.userId })
    res.json({ message: 'Cart cleared.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── POST /api/cart/revalidate ─────────────────────────────────────
// Checks every cart item against current stock.
// Auto-corrects quantities that exceed stock.
// Returns a warning if any item was adjusted.
exports.revalidateCart = async (req, res) => {
  try {
    const cart = await Cart
      .findOne({ userId: req.user.userId })
      .populate('items.productId', 'title price image stock isActive')

    if (!cart) return res.json({ items: [], total: 0, warnings: [] })

    const warnings = []

    for (const item of cart.items) {
      const product = item.productId
      if (!product || !product.isActive) {
        warnings.push(`"${product?.title || 'A product'}" is no longer available and was removed.`)
        item.quantity = 0   // mark for removal
        continue
      }
      if (item.quantity > product.stock) {
        if (product.stock === 0) {
          warnings.push(`"${product.title}" is out of stock and was removed from your cart.`)
          item.quantity = 0
        } else {
          warnings.push(`"${product.title}" quantity adjusted to ${product.stock} (available stock).`)
          item.quantity = product.stock
        }
      }
    }

    // remove items with qty 0
    cart.items = cart.items.filter(i => i.quantity > 0)
    await cart.save()

    const items = shapeItems(cart)
    const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)

    res.json({ items, total, warnings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
