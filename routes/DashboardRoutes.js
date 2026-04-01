'use strict'

const dashboardController = require('../controllers/DashboardController')
const { authenticate }    = require('../middleware/authMiddleware')
const adapt               = require('../utils/adaptRequest')

module.exports = [
  {
    method: 'GET', path: '/api/dashboard/stats', options: { auth: false },
    handler: (request, h) => {
      const { req, res } = adapt(request, h)
      req.user = authenticate(request)
      return dashboardController.getDashboardStats(req, res)
    },
  },
]
