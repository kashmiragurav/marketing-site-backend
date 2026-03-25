// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resendVerification,
  resetPassword,
  getAllUsers,
  me,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

// Make sure these match your actual file
const { registerSchema, loginSchema } = require("../validations/authValidations");

// ─── AUTH ROUTES ─────────────────────────────

// POST /api/auth/register
router.post("/register", validate(registerSchema), register);

// GET /api/auth/verify-email?token=xxx
router.get("/verify-email", verifyEmail);

// POST /api/auth/resend-verification
router.post("/resend-verification", resendVerification);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

// GET /api/auth/me — protected route
router.get("/me", authMiddleware, me);

// GET /api/auth/users — protected route
router.get("/users", authMiddleware, getAllUsers);

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // set true if using HTTPS
    sameSite: "strict",
    path: "/",
  });

  return res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;