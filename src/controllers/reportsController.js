const Site = require('../models/Site');
const Worker = require('../models/Worker');
const Material = require('../models/Material');
const Expense = require('../models/Expense');

// Dashboard summary for Super Admin
const getDashboardStats = async (req, res) => {
  try {
    // Parallel Mongoose queries for totals
    const [totalSites, activeSites, totalWorkers, totalPaymentsAgg, totalExpensesAgg, totalMaterialCostAgg] = await Promise.all([
      Site.countDocuments(),
      Site.countDocuments({ is_active: true }),
      Worker.countDocuments(),
      Worker.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Expense.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Material.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    ]);

    const totalPayments = totalPaymentsAgg[0]?.total ?? 0;
    const totalExpenses = totalExpensesAgg[0]?.total ?? 0;
    const totalMaterialCost = totalMaterialCostAgg[0]?.total ?? 0;

    // Expense breakdown by head (top 8)
    const expenseBreakdown = await Expense.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$expense_head', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
      { $sort: { value: -1 } },
      { $limit: 8 },
    ]);

    // Site‑wise expenses with payments and materials
    const siteWiseExpenses = await Site.aggregate([
      {
        $lookup: {
          from: 'expenses',
          let: { siteId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$site_id', '$$siteId'] }, { $eq: ['$status', 'approved'] }] } } },
            { $group: { _id: null, expenses: { $sum: '$amount' } } },
          ],
          as: 'exp'
        }
      },
      { $unwind: { path: '$exp', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: 'site_id',
          as: 'workers'
        }
      },
      {
        $lookup: {
          from: 'materials',
          localField: '_id',
          foreignField: 'site_id',
          as: 'materials'
        }
      },
      {
        $addFields: {
          expenses: { $ifNull: ['$exp.expenses', 0] },
          payments: { $sum: '$workers.total_amount' },
          materials: { $sum: '$materials.total_amount' }
        }
      },
      { $project: { name: '$name', expenses: 1, payments: 1, materials: 1, _id: 0 } },
    ]);

    // Monthly expenses for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const monthlyExpenses = await Expense.aggregate([
      { $match: { status: 'approved', date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          month: { $dateToString: { format: '%b %Y', date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: 1 } } } },
          y: '$_id.year',
          m: '$_id.month',
          total: 1,
          _id: 0
        }
      },
      { $sort: { y: 1, m: 1 } },
    ]);

    const payload = {
      stats: {
        total_sites: totalSites,
        active_sites: activeSites,
        total_workers: totalWorkers,
        total_payments: totalPayments,
        total_expenses: totalExpenses,
        total_material_cost: totalMaterialCost,
      },
      expenseBreakdown,
      siteWiseExpenses,
      monthlyExpenses,
    };

    console.log('[reports/dashboard] computed payload:', {
      stats: payload.stats,
      expenseBreakdownCount: expenseBreakdown?.length ?? 0,
      siteWiseExpensesCount: siteWiseExpenses?.length ?? 0,
      monthlyExpensesCount: monthlyExpenses?.length ?? 0,
    });

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Dashboard for Site Admin
const getSiteDashboard = async (req, res) => {
  try {
    const siteId = req.user.role === 'siteadmin' ? req.user.site_id : req.query.site_id;
    if (!siteId) return res.status(400).json({ message: 'site_id required.' });

    const [workerCount, totalWages, materialCost, expenseTotal, pendingExpenses] = await Promise.all([
      Worker.countDocuments({ site_id: siteId }),
      Worker.aggregate([{ $match: { site_id: siteId } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Material.aggregate([{ $match: { site_id: siteId } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Expense.aggregate([ { $match: { site_id: siteId, status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]),
      Expense.countDocuments({ site_id: siteId, status: 'pending' })
    ]);

    const totalWagesVal = totalWages[0]?.total ?? 0;
    const materialCostVal = materialCost[0]?.total ?? 0;
    const expenseTotalVal = expenseTotal[0]?.total ?? 0;

    const recentMaterials = await Material.find({ site_id: siteId }).sort({ created_at: -1 }).limit(5);
    const materialBreakdown = await Material.aggregate([
      { $match: { site_id: siteId } },
      { $group: { _id: '$material_type', value: { $sum: '$total_amount' } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    res.json({
      stats: { worker_count: workerCount, total_wages: totalWagesVal, material_cost: materialCostVal, expense_total: expenseTotalVal, pending_expenses: pendingExpenses },
      recentMaterials,
      materialBreakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getDailyReport = async (req, res) => {
  try {
    const { date, site_id } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];
    let siteFilter = site_id ? parseInt(site_id) : null;
    if (req.user.role === 'siteadmin') siteFilter = req.user.site_id;

    const match = { date: new Date(reportDate) };
    if (siteFilter) match.site_id = siteFilter;

    const [materials, workers, expenses] = await Promise.all([
      Material.find(match).populate('site_id', 'name'),
      Worker.find({ work_period_start: { $lte: new Date(reportDate) }, work_period_end: { $gte: new Date(reportDate) }, ...(siteFilter && { site_id: siteFilter }) }).populate('site_id', 'name'),
      Expense.find(match).populate('site_id', 'name'),
    ]);

    res.json({ date: reportDate, materials, workers, expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, site_id } = req.query;
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    let siteFilter = site_id ? parseInt(site_id) : null;
    if (req.user.role === 'siteadmin') siteFilter = req.user.site_id;

    const match = { $expr: { $and: [{ $eq: [{ $month: '$date' }, m] }, { $eq: [{ $year: '$date' }, y] }] } };
    if (siteFilter) match.site_id = siteFilter;

    const [materialSummary, workerSummary, expenseSummary, totals] = await Promise.all([
      Material.aggregate([
        { $match: { $expr: { $and: [{ $eq: [{ $month: '$date' }, m] }, { $eq: [{ $year: '$date' }, y] }] } } },
        ...(siteFilter ? [{ $match: { site_id: siteFilter } }] : []),
        { $group: { _id: '$material_type', qty: { $sum: '$quantity' }, total: { $sum: '$total_amount' } } },
        { $project: { material_type: '$_id', qty: 1, total: 1, _id: 0 } }
      ]),
      Worker.aggregate([
        { $match: { $expr: { $and: [{ $eq: [{ $month: '$work_period_start' }, m] }, { $eq: [{ $year: '$work_period_start' }, y] }] } } },
        ...(siteFilter ? [{ $match: { site_id: siteFilter } }] : []),
        { $group: { _id: '$profession', count: { $sum: 1 }, total: { $sum: '$total_amount' } } },
        { $project: { profession: '$_id', count: 1, total: 1, _id: 0 } }
      ]),
      Expense.aggregate([
        { $match: { $expr: { $and: [{ $eq: [{ $month: '$date' }, m] }, { $eq: [{ $year: '$date' }, y] }, { $eq: ['$status', 'approved'] }] } } },
        ...(siteFilter ? [{ $match: { site_id: siteFilter } }] : []),
        { $group: { _id: '$expense_head', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $project: { expense_head: '$_id', total: 1, count: 1, _id: 0 } }
      ]),
      // Totals across collections
      Promise.all([
        Material.aggregate([{ $match: { $expr: { $and: [{ $eq: [{ $month: '$date' }, m] }, { $eq: [{ $year: '$date' }, y] }] } } }, ...(siteFilter ? [{ $match: { site_id: siteFilter } }] : []), { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
        Worker.aggregate([{ $match: { $expr: { $and: [{ $eq: [{ $month: '$work_period_start' }, m] }, { $eq: [{ $year: '$work_period_start' }, y] }] } }, ...(siteFilter ? [{ $match: { site_id: siteFilter } }] : []), { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
        Expense.aggregate([{ $match: { $expr: { $and: [{ $eq: [{ $month: '$date' }, m] }, { $eq: [{ $year: '$date' }, y] }, { $eq: ['$status', 'approved'] }] } }, ...(siteFilter ? [{ $match: { site_id: siteFilter } }] : []), { $group: { _id: null, total: { $sum: '$amount' } } }])
      ]),
    ]);

    const materialTotal = materialSummary[0]?.total ?? 0;
    const workerTotal = workerSummary[0]?.total ?? 0;
    const expenseTotal = expenseSummary[0]?.total ?? 0;

    res.json({ month: m, year: y, totals: { material_total: materialTotal, worker_total: workerTotal, expense_total: expenseTotal }, materialSummary, workerSummary, expenseSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getSiteWiseReport = async (req, res) => {
  try {
    const sites = await Site.find();
    const result = await Promise.all(sites.map(async (site) => {
      const [materialCost, workerInfo, expenseTotal] = await Promise.all([
        Material.aggregate([ { $match: { site_id: site._id } }, { $group: { _id: null, total: { $sum: '$total_amount' } } } ]),
        Worker.aggregate([ { $match: { site_id: site._id } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total_amount' } } } ]),
        Expense.aggregate([ { $match: { site_id: site._id, status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } } ])
      ]);
      const materialCostVal = materialCost[0]?.total ?? 0;
      const workerCount = workerInfo[0]?.count ?? 0;
      const workerCost = workerInfo[0]?.total ?? 0;
      const expenseTotalVal = expenseTotal[0]?.total ?? 0;
      return {
        ...site.toObject(),
        material_cost: materialCostVal,
        worker_count: workerCount,
        worker_cost: workerCost,
        expense_total: expenseTotalVal,
        grand_total: materialCostVal + workerCost + expenseTotalVal,
      };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getTotalExpensesReport = async (req, res) => {
  try {
    const [materialTotal, workerTotal, expenseTotal, byCategory, bySite] = await Promise.all([
      Material.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Worker.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Expense.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$expense_head', total: { $sum: '$amount' } } }, { $project: { category: '$_id', total: 1, _id: 0 } }]),
      Site.aggregate([
        {
          $lookup: {
            from: 'expenses',
            let: { siteId: '$_id' },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$site_id', '$$siteId'] }, { $eq: ['$status', 'approved'] }] } } },
              { $group: { _id: null, expense_total: { $sum: '$amount' } } }
            ],
            as: 'exp'
          }
        },
        { $unwind: { path: '$exp', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$name', expense_total: { $ifNull: ['$exp.expense_total', 0] } } },
        { $sort: { expense_total: -1 } }
      ])
    ]);

    const materialCost = materialTotal[0]?.total ?? 0;
    const workerCost = workerTotal[0]?.total ?? 0;
    const otherExpenses = expenseTotal[0]?.total ?? 0;

    res.json({
      summary: {
        material_cost: materialCost,
        worker_cost: workerCost,
        other_expenses: otherExpenses,
        grand_total: materialCost + workerCost + otherExpenses,
      },
      byCategory,
      bySite,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getDashboardStats, getSiteDashboard, getDailyReport, getMonthlyReport, getSiteWiseReport, getTotalExpensesReport };
