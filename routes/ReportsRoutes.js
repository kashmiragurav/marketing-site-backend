'use strict'

const reports          = require('../controllers/ReportsController')
const { authenticate } = require('../middleware/authMiddleware')
const requireRole      = require('../middleware/roleMiddleware')

module.exports = [
  {
    method: 'GET', path: '/api/reports/summary', options: { auth: false },
    handler: (request, h) => {
      const user = authenticate(request)
      requireRole('admin', 'super_admin')(user)
      request.user = user
      return reports.getReportSummary(request, h)
    },
  },
]
