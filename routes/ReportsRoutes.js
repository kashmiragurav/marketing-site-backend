const express = require('express')
const router  = express.Router()

const reportsController = require('../controllers/ReportsController')
const authMiddleware    = require('../middleware/authMiddleware')
const requireRole       = require('../middleware/roleMiddleware')

// Admin + Super Admin only
router.get('/summary', authMiddleware, requireRole('admin', 'super_admin'), reportsController.getReportSummary)

module.exports = router
