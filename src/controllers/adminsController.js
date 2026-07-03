const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const getAllAdmins = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.site_id, u.is_active, u.created_at,
              s.name as site_name
       FROM users u LEFT JOIN sites s ON u.site_id = s.id
       WHERE u.role = 'siteadmin'
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getAdminById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.site_id, u.is_active, s.name as site_name
       FROM users u LEFT JOIN sites s ON u.site_id = s.id WHERE u.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Admin not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { name, email, password, site_id } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email already in use.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, site_id) VALUES (?, ?, ?, "siteadmin", ?)',
      [name, email, hash, site_id || null]
    );
    const [newAdmin] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.site_id, u.is_active, s.name as site_name
       FROM users u LEFT JOIN sites s ON u.site_id = s.id WHERE u.id = ?`,
      [result.insertId]
    );
    res.status(201).json(newAdmin[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { name, email, site_id } = req.body;
    await pool.query(
      'UPDATE users SET name = ?, email = ?, site_id = ? WHERE id = ? AND role = "siteadmin"',
      [name, email, site_id || null, req.params.id]
    );
    const [updated] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.site_id, u.is_active, s.name as site_name
       FROM users u LEFT JOIN sites s ON u.site_id = s.id WHERE u.id = ?`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ? AND role = "siteadmin"', [req.params.id]);
    res.json({ message: 'Admin deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const toggleAdminStatus = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "siteadmin"', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Admin not found.' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ message: `Admin ${newStatus ? 'activated' : 'deactivated'}.`, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password is required.' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ? AND role = "siteadmin"', [hash, req.params.id]);
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAllAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin, toggleAdminStatus, resetAdminPassword };
