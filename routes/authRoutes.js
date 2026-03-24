const express = require("express");
const router = express.Router();
const { me } = require("../controllers/authController");

const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resendVerification,
  resetPassword,
  getAllUsers,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/auth/register
router.post("/register", register);

// GET /api/auth/verify-email?token=xxx
router.get("/verify-email", verifyEmail);

router.post("/resend-verification",resendVerification);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, me);

// GET /api/auth/users — protected, only logged in users can access
router.get("/users", authMiddleware, getAllUsers);

// routes/authRoutes.js
router.post("/logout", (req, res) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path:"/",
  });

  return res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
