const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/DashboardController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// ─── Admin only routes ─────────────────────────────────────────────────
router.get("/stats", 
  authMiddleware, 
  requireRole("admin"), 
  dashboardController.getDashboardStats
);

module.exports = router;
