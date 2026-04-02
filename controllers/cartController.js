'use strict'

const Boom    = require('@hapi/boom')
const Cart    = require('../models/Cart')
const Product = require('../models/Product')

function shapeItems(cart) {
  return cart.items.map(item => ({ _id: item._id, quantity: item.quantity, product: item.productId }))
}

// ─── GET CART ────────────────────────────────────────────────────
exports.getCart = async (request, h) => {
  const cart = await Cart.findOne({ userId: request.user.userId }).populate('items.productId', 'title price image stock isActive')
  if (!cart) return h.response({ items: [], total: 0 }).code(200)
  const items = shapeItems(cart)
  const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)
  return h.response({ items, total }).code(200)
}

// ─── ADD TO CART ─────────────────────────────────────────────────
exports.addToCart = async (request, h) => {
  const { productId, quantity = 1 } = request.payload || {}
  if (!productId) throw Boom.badRequest('productId is required.')

  const product = await Product.findById(productId)
  if (!product)           throw Boom.notFound('Product not found.')
  if (!product.isActive)  throw Boom.badRequest('Product is no longer available.')
  if (product.stock === 0) return h.response({ success: false, message: 'This product is out of stock.', availableStock: 0 }).code(400)

  let cart = await Cart.findOne({ userId: request.user.userId })

  if (!cart) {
    const safeQty = Math.min(Number(quantity), product.stock)
    cart = await Cart.create({ userId: request.user.userId, items: [{ productId, quantity: safeQty }] })
  } else {
    const existing = cart.items.find(i => i.productId.toString() === productId)
    if (existing) {
      const newQty = existing.quantity + Number(quantity)
      if (newQty > product.stock) {
        return h.response({ success: false, message: `Only ${product.stock} item(s) available.`, availableStock: product.stock }).code(400)
      }
      existing.quantity = newQty
    } else {
      cart.items.push({ productId, quantity: Math.min(Number(quantity), product.stock) })
    }
    await cart.save()
  }

  return h.response({ success: true, message: 'Added to cart.' }).code(201)
}

// ─── UPDATE CART ITEM ────────────────────────────────────────────
exports.updateCartItem = async (request, h) => {
  const { quantity } = request.payload || {}
  if (!quantity || quantity < 1) throw Boom.badRequest('Quantity must be at least 1.')

  const cart = await Cart.findOne({ userId: request.user.userId }).populate('items.productId', 'stock title')
  if (!cart) throw Boom.notFound('Cart not found.')

  const item = cart.items.find(i => i._id.toString() === request.params.productId)
  if (!item) throw Boom.notFound('Item not found in cart.')

  const stock = item.productId?.stock ?? 0
  if (Number(quantity) > stock) {
    item.quantity = stock
    await cart.save()
    return h.response({ success: false, message: `Only ${stock} item(s) available. Quantity adjusted.`, availableStock: stock, correctedQty: stock }).code(400)
  }

  item.quantity = Number(quantity)
  await cart.save()
  return h.response({ success: true, message: 'Quantity updated.' }).code(200)
}

// ─── DELETE CART ITEM ────────────────────────────────────────────
exports.deleteCartItem = async (request, h) => {
  const cart = await Cart.findOne({ userId: request.user.userId })
  if (!cart) throw Boom.notFound('Cart not found.')

  const before = cart.items.length
  cart.items   = cart.items.filter(i => i._id.toString() !== request.params.productId)
  if (cart.items.length === before) throw Boom.notFound('Item not found in cart.')

  await cart.save()
  return h.response({ message: 'Item removed.' }).code(200)
}

// ─── CLEAR CART ──────────────────────────────────────────────────
exports.clearCart = async (request, h) => {
  await Cart.findOneAndDelete({ userId: request.user.userId })
  return h.response({ message: 'Cart cleared.' }).code(200)
}

// ─── REVALIDATE CART ─────────────────────────────────────────────
exports.revalidateCart = async (request, h) => {
  const cart = await Cart.findOne({ userId: request.user.userId }).populate('items.productId', 'title price image stock isActive')
  if (!cart) return h.response({ items: [], total: 0, warnings: [] }).code(200)

  const warnings = []
  for (const item of cart.items) {
    const product = item.productId
    if (!product || !product.isActive) {
      warnings.push(`"${product?.title || 'A product'}" is no longer available and was removed.`)
      item.quantity = 0
      continue
    }
    if (item.quantity > product.stock) {
      if (product.stock === 0) {
        warnings.push(`"${product.title}" is out of stock and was removed.`)
        item.quantity = 0
      } else {
        warnings.push(`"${product.title}" quantity adjusted to ${product.stock}.`)
        item.quantity = product.stock
      }
    }
  }

  cart.items = cart.items.filter(i => i.quantity > 0)
  await cart.save()

  const items = shapeItems(cart)
  const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)
  return h.response({ items, total, warnings }).code(200)
}
