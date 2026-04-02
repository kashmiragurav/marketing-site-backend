'use strict'

const dashboard        = require('../controllers/DashboardController')
const { authenticate } = require('../middleware/authMiddleware')

module.exports = [
  {
    method: 'GET', path: '/api/dashboard/stats', options: { auth: false },
    handler: (request, h) => { request.user = authenticate(request); return dashboard.getDashboardStats(request, h) },
  },
]
