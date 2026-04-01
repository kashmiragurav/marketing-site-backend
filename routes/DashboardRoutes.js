const express = require("express");
const router  = express.Router();

const dashboardController = require("../controllers/DashboardController");
const authMiddleware      = require("../middleware/authMiddleware");

// Any authenticated user can view dashboard stats
// Role restriction removed — existing users may have legacy role values
// that don't match the new enum, causing 403 errors
router.get("/stats", authMiddleware, dashboardController.getDashboardStats);

module.exports = router;
