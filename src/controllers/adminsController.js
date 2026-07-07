const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Get all site admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'siteadmin' })
      .populate('site_id', 'name')
      .select('-password_hash');
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'siteadmin' })
      .populate('site_id', 'name')
      .select('-password_hash');
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create a new admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, site_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use.' });
    const hash = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      name,
      email,
      password_hash: hash,
      role: 'siteadmin',
      site_id: site_id || null
    });
    const populated = await newAdmin.populate('site_id', 'name').execPopulate();
    const { password_hash, ...rest } = populated.toObject();
    res.status(201).json(rest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update admin details
const updateAdmin = async (req, res) => {
  try {
    const { name, email, site_id } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, site_id },
      { new: true, runValidators: true }
    )
      .populate('site_id', 'name')
      .select('-password_hash');
    if (!updated) return res.status(404).json({ message: 'Admin not found.' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete an admin
const deleteAdmin = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Admin not found.' });
    res.json({ message: 'Admin deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Toggle admin active status
const toggleAdminStatus = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    admin.is_active = !admin.is_active;
    await admin.save();
    res.json({ message: `Admin ${admin.is_active ? 'activated' : 'deactivated'}.`, is_active: admin.is_active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Reset admin password
const resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'New password is required.' });
    const hash = await bcrypt.hash(newPassword, 10);
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { password_hash: hash },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Admin not found.' });
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
  resetAdminPassword
};
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
