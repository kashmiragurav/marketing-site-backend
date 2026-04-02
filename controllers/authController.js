'use strict'

const bcrypt = require('bcrypt')
const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const Boom   = require('@hapi/boom')
const User   = require('../models/User')
const transporter = require('../config/mailer')

// ─── REGISTER ────────────────────────────────────────────────────
exports.register = async (request, h) => {
  const { name, email, password } = request.payload || {}

  if (!name || !email || !password) throw Boom.badRequest('Name, email, and password are required.')
  if (password.length < 6)          throw Boom.badRequest('Password must be at least 6 characters.')

  const existing = await User.findOne({ email })
  if (existing) throw Boom.conflict('Email already registered.')

  const hashedPassword     = await bcrypt.hash(password, 10)
  const verificationToken  = crypto.randomBytes(32).toString('hex')
  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000)

  const user = await User.create({
    name, email,
    password: hashedPassword,
    isVerified: false,
    verificationTokens: [{ token: verificationToken, expires: verificationExpiry, used: false }],
  })

  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
  console.log('Verification Link:', verificationLink)

  await transporter.sendMail({
    from:    `"Auth App" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Verify your email',
    html:    `<p>Hi ${name},</p><p>Please verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
  })

  return h.response({ message: 'Account created. Please verify your email.', userId: user._id }).code(201)
}

// ─── VERIFY EMAIL ────────────────────────────────────────────────
exports.verifyEmail = async (request, h) => {
  const { token } = request.query
  if (!token) throw Boom.badRequest('Verification token is required.')

  const user = await User.findOne({ 'verificationTokens.token': token })
  if (!user) throw Boom.badRequest('Invalid verification link.')

  const tokenData = user.verificationTokens.find(t => t.token === token)
  if (!tokenData || tokenData.used) {
    return h.response({ error: 'InvalidOrExpired', message: 'Verification link is invalid or already used.', email: user.email, allowResend: true }).code(200)
  }
  if (new Date(tokenData.expires) < new Date()) {
    return h.response({ error: 'Expired', message: 'Verification link expired.', email: user.email, allowResend: true }).code(200)
  }

  user.isVerified  = true
  tokenData.used   = true
  await user.save()

  return h.response({ success: true, message: 'Email verified successfully. You can now log in.' }).code(200)
}

// ─── RESEND VERIFICATION ─────────────────────────────────────────
exports.resendVerification = async (request, h) => {
  const { email } = request.payload || {}
  if (!email) throw Boom.badRequest('Email is required.')

  const user = await User.findOne({ email })
  if (!user)          throw Boom.notFound('User not found.')
  if (user.isVerified) throw Boom.badRequest('Email is already verified.')

  user.verificationTokens = user.verificationTokens.filter(t => new Date(t.expires) > new Date())

  const newToken = crypto.randomBytes(32).toString('hex')
  user.verificationTokens.push({ token: newToken, expires: new Date(Date.now() + 15 * 60 * 1000), used: false })
  user.verificationTokens = user.verificationTokens.slice(-5)
  await user.save()

  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${newToken}`
  await transporter.sendMail({
    from:    `"Auth App" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Resend: Verify your email',
    html:    `<p>Click below to verify your email:</p><a href="${verificationLink}">${verificationLink}</a><p>Expires in 15 minutes.</p>`,
  })

  return h.response({ success: true, message: 'Verification email resent successfully.' }).code(200)
}

// ─── LOGIN ───────────────────────────────────────────────────────
exports.login = async (request, h) => {
  const { email, password, rememberMe } = request.payload || {}
  if (!email || !password) throw Boom.badRequest('Email and password are required.')

  const user = await User.findOne({ email })
  if (!user)             throw Boom.unauthorized('Email not registered. Please signup first.')
  if (!user.isVerified)  throw Boom.forbidden('Please verify your email before logging in.')

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw Boom.unauthorized('Incorrect password.')

  const token = jwt.sign(
    { userId: user._id, id: user._id, _id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? '7d' : '1d' }
  )

  const cookieOpts = {
    ttl:        rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    isSecure:   false,
    isHttpOnly: true,
    isSameSite: 'Lax',
    path:       '/',
    encoding:   'none',
  }

  return h
    .response({ message: 'Login successful.', email: user.email, name: user.name, role: user.role, userId: user._id, _id: user._id })
    .state('token', token, cookieOpts)
    .code(200)
}

// ─── ME ──────────────────────────────────────────────────────────
exports.me = (request, h) => {
  // user already decoded by authenticate() in the route handler
  const u = request.user
  return h.response({ email: u.email, name: u.name, role: u.role, userId: u.userId, id: u.id || u.userId, _id: u._id || u.userId }).code(200)
}

// ─── LOGOUT ──────────────────────────────────────────────────────
exports.logout = (request, h) => {
  return h.response({ message: 'Logged out successfully.' }).unstate('token').code(200)
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────────
exports.forgotPassword = async (request, h) => {
  const { email } = request.payload || {}
  if (!email) throw Boom.badRequest('Email is required.')

  const user = await User.findOne({ email })
  if (!user) return h.response({ message: 'If that email exists, a reset link has been sent.' }).code(200)

  const resetToken  = crypto.randomBytes(32).toString('hex')
  user.resetToken        = resetToken
  user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
  await user.save()

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
  await transporter.sendMail({
    from:    `"Auth App" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Password Reset Request',
    html:    `<p>Click the link to reset your password (expires in 1 hour):</p><a href="${resetLink}">${resetLink}</a>`,
  })

  return h.response({ message: 'If that email exists, a reset link has been sent.' }).code(200)
}

// ─── RESET PASSWORD ──────────────────────────────────────────────
exports.resetPassword = async (request, h) => {
  const { token, newPassword } = request.payload || {}
  if (!token || !newPassword) throw Boom.badRequest('Token and new password are required.')

  const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } })
  if (!user) throw Boom.badRequest('Invalid or expired reset token.')

  user.password          = await bcrypt.hash(newPassword, 10)
  user.resetToken        = undefined
  user.resetTokenExpires = undefined
  await user.save()

  return h.response({ message: 'Password reset successfully. You can now log in.' }).code(200)
}

// ─── GET ALL USERS ───────────────────────────────────────────────
exports.getAllUsers = async (request, h) => {
  const users = await User.find({}, { password: 0, resetToken: 0, verificationTokens: 0 })
  return h.response({ count: users.length, users }).code(200)
}
