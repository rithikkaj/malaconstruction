const Expense = require('../models/Expense');
const Site = require('../models/Site');
const User = require('../models/User'); // For population of created_by and approved_by

// Get expenses with optional filters
const getExpenses = async (req, res) => {
  try {
    const { site_id, status, from, to } = req.query;
    const filter = {};
    if (req.user.role === 'siteadmin') filter.site_id = req.user.site_id;
    if (site_id) filter.site_id = site_id;
    if (status) filter.status = status;
    if (from) filter.date = { $gte: new Date(from) };
    if (to) filter.date = { ...filter.date, $lte: new Date(to) };

    const expenses = await Expense.find(filter)
      .populate('site_id', 'name')
      .populate('created_by', 'name')
      .populate('approved_by', 'name');
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single expense by ID
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('site_id', 'name')
      .populate('created_by', 'name')
      .populate('approved_by', 'name');
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create a new expense
const createExpense = async (req, res) => {
  try {
    const { site_id, expense_head, description, amount, date, payment_mode, receipt_bill } = req.body;
    const actualSiteId = req.user.role === 'siteadmin' ? req.user.site_id : site_id;
    if (!actualSiteId || !expense_head || !amount || !date) {
      return res.status(400).json({ message: 'site_id, expense_head, amount, and date are required.' });
    }
    const newExpense = await Expense.create({
      site_id: actualSiteId,
      expense_head,
      description,
      amount,
      date,
      payment_mode,
      receipt_bill,
      created_by: req.user.id,
      status: 'pending'
    });
    const populated = await newExpense
      .populate('site_id', 'name')
      .populate('created_by', 'name')
      .execPopulate();
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update an existing expense
const updateExpense = async (req, res) => {
  try {
    const update = { ...req.body };
    const updated = await Expense.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('site_id', 'name')
      .populate('created_by', 'name')
      .populate('approved_by', 'name');
    if (!updated) return res.status(404).json({ message: 'Expense not found.' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete an expense
const deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Approve an expense
const approveExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approved_by: req.user.id, approved_at: new Date() },
      { new: true }
    )
      .populate('site_id', 'name')
      .populate('created_by', 'name')
      .populate('approved_by', 'name');
    if (!updated) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Expense approved.', expense: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Reject an expense
const rejectExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approved_by: req.user.id, approved_at: new Date() },
      { new: true }
    )
      .populate('site_id', 'name')
      .populate('created_by', 'name')
      .populate('approved_by', 'name');
    if (!updated) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Expense rejected.', expense: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense, approveExpense, rejectExpense };

const getExpenses = async (req, res) => {
  try {
    const { site_id, status, from, to } = req.query;
    let siteFilter = site_id ? parseInt(site_id) : null;
    if (req.user.role === 'siteadmin') siteFilter = req.user.site_id;

    let query = `SELECT e.*, s.name as site_name, u.name as created_by_name, a.name as approved_by_name
                 FROM expenses e
                 LEFT JOIN sites s ON e.site_id = s.id
                 LEFT JOIN users u ON e.created_by = u.id
                 LEFT JOIN users a ON e.approved_by = a.id
                 WHERE 1=1`;
    const params = [];
    if (siteFilter) { query += ' AND e.site_id = ?'; params.push(siteFilter); }
    if (status) { query += ' AND e.status = ?'; params.push(status); }
    if (from) { query += ' AND e.date >= ?'; params.push(from); }
    if (to) { query += ' AND e.date <= ?'; params.push(to); }
    query += ' ORDER BY e.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, s.name as site_name FROM expenses e 
       LEFT JOIN sites s ON e.site_id = s.id WHERE e.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Expense not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const createExpense = async (req, res) => {
  try {
    const { site_id, expense_head, description, amount, date, payment_mode, receipt_bill } = req.body;
    const actualSiteId = req.user.role === 'siteadmin' ? req.user.site_id : site_id;

    if (!actualSiteId || !expense_head || !amount || !date)
      return res.status(400).json({ message: 'site_id, expense_head, amount, and date are required.' });

    const [result] = await pool.query(
      `INSERT INTO expenses (site_id, expense_head, description, amount, date, payment_mode, receipt_bill, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actualSiteId, expense_head, description, amount, date, payment_mode, receipt_bill, req.user.id]
    );
    const [newRow] = await pool.query(
      'SELECT e.*, s.name as site_name FROM expenses e LEFT JOIN sites s ON e.site_id = s.id WHERE e.id = ?',
      [result.insertId]
    );
    res.status(201).json(newRow[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { expense_head, description, amount, date, payment_mode, receipt_bill } = req.body;
    await pool.query(
      `UPDATE expenses SET expense_head=?, description=?, amount=?, date=?, payment_mode=?, receipt_bill=?
       WHERE id=?`,
      [expense_head, description, amount, date, payment_mode, receipt_bill, req.params.id]
    );
    const [updated] = await pool.query(
      'SELECT e.*, s.name as site_name FROM expenses e LEFT JOIN sites s ON e.site_id = s.id WHERE e.id = ?',
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const approveExpense = async (req, res) => {
  try {
    await pool.query(
      'UPDATE expenses SET status="approved", approved_by=?, approved_at=NOW() WHERE id=?',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Expense approved.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const rejectExpense = async (req, res) => {
  try {
    await pool.query(
      'UPDATE expenses SET status="rejected", approved_by=?, approved_at=NOW() WHERE id=?',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Expense rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense, approveExpense, rejectExpense };
