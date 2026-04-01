'use strict'

const reportsController = require('../controllers/ReportsController')
const { authenticate }  = require('../middleware/authMiddleware')
const requireRole       = require('../middleware/roleMiddleware')
const adapt             = require('../utils/adaptRequest')

module.exports = [
  {
    method: 'GET', path: '/api/reports/summary', options: { auth: false },
    handler: (request, h) => {
      const user = authenticate(request)
      requireRole('admin', 'super_admin')(user)
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = user
      reportsController.getReportSummary(req, res, next)
      return responsePromise
    },
  },
]
