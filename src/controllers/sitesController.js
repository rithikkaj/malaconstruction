const { pool } = require('../config/db');

const getAllSites = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM users u WHERE u.site_id = s.id AND u.role='siteadmin') as admin_count,
        (SELECT COUNT(*) FROM workers w WHERE w.site_id = s.id) as worker_count,
        (SELECT COALESCE(SUM(amount),0) FROM expenses e WHERE e.site_id = s.id AND e.status='approved') as total_expenses
       FROM sites s ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getSiteById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Site not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const createSite = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ message: 'Site name is required.' });
    const [result] = await pool.query(
      'INSERT INTO sites (name, location) VALUES (?, ?)',
      [name, location || '']
    );
    const [newSite] = await pool.query('SELECT * FROM sites WHERE id = ?', [result.insertId]);
    res.status(201).json(newSite[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateSite = async (req, res) => {
  try {
    const { name, location, is_active } = req.body;
    await pool.query(
      'UPDATE sites SET name = ?, location = ?, is_active = ? WHERE id = ?',
      [name, location, is_active, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteSite = async (req, res) => {
  try {
    await pool.query('DELETE FROM sites WHERE id = ?', [req.params.id]);
    res.json({ message: 'Site deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const toggleSiteStatus = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Site not found.' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.query('UPDATE sites SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ message: `Site ${newStatus ? 'activated' : 'deactivated'} successfully.`, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAllSites, getSiteById, createSite, updateSite, deleteSite, toggleSiteStatus };
