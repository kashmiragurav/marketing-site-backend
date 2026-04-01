const express = require('express')
const router  = express.Router()

const dashboardController = require('../controllers/DashboardController')
const authMiddleware      = require('../middleware/authMiddleware')

// Any authenticated user can view dashboard stats — no role restriction
router.get('/stats', authMiddleware, dashboardController.getDashboardStats)

module.exports = router
