const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDashboardStats, getSiteDashboard, getDailyReport, getMonthlyReport, getSiteWiseReport, getTotalExpensesReport } = require('../controllers/reportsController');

router.use(authenticate);
router.get('/dashboard', getDashboardStats);
router.get('/site-dashboard', getSiteDashboard);
router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/sitewise', getSiteWiseReport);
router.get('/total-expenses', getTotalExpensesReport);

module.exports = router;
