const { pool } = require('../config/db');

const getWorkers = async (req, res) => {
  try {
    const { site_id, from, to } = req.query;
    let siteFilter = site_id ? parseInt(site_id) : null;
    if (req.user.role === 'siteadmin') siteFilter = req.user.site_id;

    let query = `SELECT w.*, s.name as site_name, u.name as created_by_name
                 FROM workers w
                 LEFT JOIN sites s ON w.site_id = s.id
                 LEFT JOIN users u ON w.created_by = u.id
                 WHERE 1=1`;
    const params = [];
    if (siteFilter) { query += ' AND w.site_id = ?'; params.push(siteFilter); }
    if (from) { query += ' AND w.work_period_start >= ?'; params.push(from); }
    if (to) { query += ' AND w.work_period_end <= ?'; params.push(to); }
    query += ' ORDER BY w.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getWorkerById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT w.*, s.name as site_name FROM workers w LEFT JOIN sites s ON w.site_id = s.id WHERE w.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Worker not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const createWorker = async (req, res) => {
  try {
    const { site_id, name, profession, daily_wage, days_worked, work_period_start, work_period_end } = req.body;
    const actualSiteId = req.user.role === 'siteadmin' ? req.user.site_id : site_id;

    if (!actualSiteId || !name || !profession || !daily_wage || days_worked === undefined)
      return res.status(400).json({ message: 'site_id, name, profession, daily_wage, and days_worked are required.' });

    const [result] = await pool.query(
      `INSERT INTO workers (site_id, name, profession, daily_wage, days_worked, work_period_start, work_period_end, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actualSiteId, name, profession, daily_wage, days_worked, work_period_start || null, work_period_end || null, req.user.id]
    );
    const [newRow] = await pool.query(
      'SELECT w.*, s.name as site_name FROM workers w LEFT JOIN sites s ON w.site_id = s.id WHERE w.id = ?',
      [result.insertId]
    );
    res.status(201).json(newRow[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateWorker = async (req, res) => {
  try {
    const { name, profession, daily_wage, days_worked, work_period_start, work_period_end } = req.body;
    await pool.query(
      `UPDATE workers SET name=?, profession=?, daily_wage=?, days_worked=?, work_period_start=?, work_period_end=?
       WHERE id=?`,
      [name, profession, daily_wage, days_worked, work_period_start || null, work_period_end || null, req.params.id]
    );
    const [updated] = await pool.query(
      'SELECT w.*, s.name as site_name FROM workers w LEFT JOIN sites s ON w.site_id = s.id WHERE w.id = ?',
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteWorker = async (req, res) => {
  try {
    await pool.query('DELETE FROM workers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Worker deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker };
