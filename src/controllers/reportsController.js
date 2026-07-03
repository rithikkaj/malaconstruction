const { pool } = require('../config/db');

// Dashboard summary for Super Admin
const getDashboardStats = async (req, res) => {
  try {
    // mysql2/promise returns: [rows, fields]
    // Run totals in parallel with correct destructuring.
    let total_sites = 0;
    let active_sites = 0;
    let total_workers = 0;
    let total_payments = 0;
    let total_expenses = 0;
    let total_material_cost = 0;

    let q1, q2, q3, q4, q5, q6;
    try {
      [q1, q2, q3, q4, q5, q6] = await Promise.all([
        pool.query('SELECT COUNT(*) as total_sites FROM sites'),
        pool.query('SELECT COUNT(*) as active_sites FROM sites WHERE is_active = 1'),
        pool.query('SELECT COUNT(*) as total_workers FROM workers'),
        pool.query('SELECT COALESCE(SUM(total_amount),0) as total_payments FROM workers'),
        pool.query('SELECT COALESCE(SUM(amount),0) as total_expenses FROM expenses WHERE status="approved"'),
        pool.query('SELECT COALESCE(SUM(total_amount),0) as total_material_cost FROM materials'),
      ]);
    } catch (err) {
      console.error('[reports/dashboard] Failed totals Promise.all:', {
        message: err?.message,
        code: err?.code,
        errno: err?.errno,
        sqlMessage: err?.sqlMessage,
        sql: err?.sql,
      });
      throw err;
    }


    total_sites = q1[0]?.total_sites ?? 0;
    active_sites = q2[0]?.active_sites ?? 0;
    total_workers = q3[0]?.total_workers ?? 0;
    total_payments = q4[0]?.total_payments ?? 0;
    total_expenses = q5[0]?.total_expenses ?? 0;
    total_material_cost = q6[0]?.total_material_cost ?? 0;

    let expenseBreakdown, siteWiseExpenses, monthlyExpenses;

    // Expense breakdown by head
    try {
      [expenseBreakdown] = await pool.query(
        `SELECT expense_head as name, SUM(amount) as value 
         FROM expenses WHERE status='approved' GROUP BY expense_head ORDER BY value DESC LIMIT 8`
      );
    } catch (e) {
      console.error('[reports/dashboard] expenseBreakdown query failed:', e);
      throw e;
    }

    // Site-wise expenses
    try {
      [siteWiseExpenses] = await pool.query(
        `SELECT s.name, 
          COALESCE(SUM(e.amount),0) as expenses,
          COALESCE((SELECT SUM(w.total_amount) FROM workers w WHERE w.site_id = s.id),0) as payments,
          COALESCE((SELECT SUM(m.total_amount) FROM materials m WHERE m.site_id = s.id),0) as materials
         FROM sites s
         LEFT JOIN expenses e ON e.site_id = s.id AND e.status='approved'
         GROUP BY s.id, s.name`
      );
    } catch (e) {
      console.error('[reports/dashboard] siteWiseExpenses query failed:', e);
      throw e;
    }

    // Monthly expenses (last 6 months)
    try {
      [monthlyExpenses] = await pool.query(
        `SELECT
           DATE_FORMAT(date, '%b %Y') AS month,
           YEAR(date) AS y,
           MONTH(date) AS m,
           SUM(amount) AS total
         FROM expenses
         WHERE status='approved'
           AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY YEAR(date), MONTH(date), month
         ORDER BY y, m`
      );
    } catch (e) {
      console.error('[reports/dashboard] monthlyExpenses query failed:', e);
      throw e;
    }


    const payload = {
      stats: {
        total_sites,
        active_sites,
        total_workers,
        total_payments,
        total_expenses,
        total_material_cost,
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

    const [[{ worker_count }]] = await pool.query('SELECT COUNT(*) as worker_count FROM workers WHERE site_id=?', [siteId]);
    const [[{ total_wages }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as total_wages FROM workers WHERE site_id=?', [siteId]);
    const [[{ material_cost }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as material_cost FROM materials WHERE site_id=?', [siteId]);
    const [[{ expense_total }]] = await pool.query('SELECT COALESCE(SUM(amount),0) as expense_total FROM expenses WHERE site_id=? AND status="approved"', [siteId]);
    const [[{ pending_expenses }]] = await pool.query('SELECT COUNT(*) as pending_expenses FROM expenses WHERE site_id=? AND status="pending"', [siteId]);

    // Recent materials
    const [recentMaterials] = await pool.query(
      'SELECT * FROM materials WHERE site_id=? ORDER BY created_at DESC LIMIT 5', [siteId]
    );

    // Material cost by type
    const [materialBreakdown] = await pool.query(
      `SELECT material_type as name, SUM(total_amount) as value FROM materials WHERE site_id=? GROUP BY material_type`,
      [siteId]
    );

    res.json({
      stats: { worker_count, total_wages, material_cost, expense_total, pending_expenses },
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

    const siteClause = siteFilter ? 'AND site_id = ?' : '';
    const params = siteFilter ? [reportDate, siteFilter] : [reportDate];

    const [materials] = await pool.query(
      `SELECT m.*, s.name as site_name FROM materials m LEFT JOIN sites s ON m.site_id = s.id WHERE m.date = ? ${siteClause} ORDER BY m.site_id`,
      params
    );
    const [workers] = await pool.query(
      `SELECT w.*, s.name as site_name FROM workers w LEFT JOIN sites s ON w.site_id = s.id WHERE w.work_period_start <= ? AND w.work_period_end >= ? ${siteClause} ORDER BY w.site_id`,
      siteFilter ? [reportDate, reportDate, siteFilter] : [reportDate, reportDate]
    );
    const [expenses] = await pool.query(
      `SELECT e.*, s.name as site_name FROM expenses e LEFT JOIN sites s ON e.site_id = s.id WHERE e.date = ? ${siteClause} ORDER BY e.site_id`,
      params
    );

    res.json({ date: reportDate, materials, workers, expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, site_id } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();
    let siteFilter = site_id ? parseInt(site_id) : null;
    if (req.user.role === 'siteadmin') siteFilter = req.user.site_id;

    const siteClause = siteFilter ? 'AND site_id = ?' : '';
    const buildParams = (...base) => siteFilter ? [...base, siteFilter] : base;

    const [materialSummary] = await pool.query(
      `SELECT material_type, SUM(quantity) as qty, SUM(total_amount) as total
       FROM materials WHERE MONTH(date)=? AND YEAR(date)=? ${siteClause} GROUP BY material_type`,
      buildParams(m, y)
    );

    const [workerSummary] = await pool.query(
      `SELECT profession, COUNT(*) as count, SUM(total_amount) as total
       FROM workers WHERE MONTH(work_period_start)=? AND YEAR(work_period_start)=? ${siteClause} GROUP BY profession`,
      buildParams(m, y)
    );

    const [expenseSummary] = await pool.query(
      `SELECT expense_head, SUM(amount) as total, COUNT(*) as count
       FROM expenses WHERE MONTH(date)=? AND YEAR(date)=? AND status='approved' ${siteClause} GROUP BY expense_head`,
      buildParams(m, y)
    );

    const [[totals]] = await pool.query(
      `SELECT 
        (SELECT COALESCE(SUM(total_amount),0) FROM materials WHERE MONTH(date)=? AND YEAR(date)=? ${siteClause}) as material_total,
        (SELECT COALESCE(SUM(total_amount),0) FROM workers WHERE MONTH(work_period_start)=? AND YEAR(work_period_start)=? ${siteClause}) as worker_total,
        (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE MONTH(date)=? AND YEAR(date)=? AND status='approved' ${siteClause}) as expense_total`,
      siteFilter ? [m, y, siteFilter, m, y, siteFilter, m, y, siteFilter] : [m, y, m, y, m, y]
    );

    res.json({ month: m, year: y, totals, materialSummary, workerSummary, expenseSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getSiteWiseReport = async (req, res) => {
  try {
    const [sites] = await pool.query('SELECT * FROM sites ORDER BY name');
    const result = [];
    for (const site of sites) {
      const [[mats]] = await pool.query(
        'SELECT COALESCE(SUM(total_amount),0) as total FROM materials WHERE site_id=?', [site.id]
      );
      const [[wkrs]] = await pool.query(
        'SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as total FROM workers WHERE site_id=?', [site.id]
      );
      const [[exps]] = await pool.query(
        'SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE site_id=? AND status="approved"', [site.id]
      );
      result.push({
        ...site,
        material_cost: mats.total,
        worker_count: wkrs.count,
        worker_cost: wkrs.total,
        expense_total: exps.total,
        grand_total: parseFloat(mats.total) + parseFloat(wkrs.total) + parseFloat(exps.total),
      });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getTotalExpensesReport = async (req, res) => {
  try {
    const [[materialTotal]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as total FROM materials');
    const [[workerTotal]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as total FROM workers');
    const [[expenseTotal]] = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status="approved"');

    const [byCategory] = await pool.query(
      `SELECT expense_head as category, SUM(amount) as total FROM expenses WHERE status='approved' GROUP BY expense_head`
    );
    const [bySite] = await pool.query(
      `SELECT s.name, 
        COALESCE(SUM(e.amount),0) as expense_total
       FROM sites s LEFT JOIN expenses e ON e.site_id = s.id AND e.status='approved'
       GROUP BY s.id, s.name ORDER BY expense_total DESC`
    );

    res.json({
      summary: {
        material_cost: materialTotal.total,
        worker_cost: workerTotal.total,
        other_expenses: expenseTotal.total,
        grand_total: parseFloat(materialTotal.total) + parseFloat(workerTotal.total) + parseFloat(expenseTotal.total),
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
