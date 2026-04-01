'use strict'

const dashboardController = require('../controllers/DashboardController')
const { authenticate }    = require('../middleware/authMiddleware')
const adapt               = require('../utils/adaptRequest')

module.exports = [
  {
    method: 'GET', path: '/api/dashboard/stats', options: { auth: false },
    handler: (request, h) => {
      const { req, res, next, responsePromise } = adapt(request, h)
      req.user = authenticate(request)
      dashboardController.getDashboardStats(req, res, next)
      return responsePromise
    },
  },
]
