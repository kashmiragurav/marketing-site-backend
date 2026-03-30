const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/ReviewController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// ─── Public routes ───────────────────────────────────────────────────
router.get("/product/:productId", reviewController.getProductReviews);

// ─── Protected routes ─────────────────────────────────────────────────
router.delete("/:id", authMiddleware, reviewController.deleteReview);

module.exports = router;
