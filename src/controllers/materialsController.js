const Material = require('../models/Material');
const Site = require('../models/Site');
const User = require('../models/User'); // For created_by population

// Get materials with optional filters and date range
const getMaterials = async (req, res) => {
  try {
    const { site_id, from, to } = req.query;
    const filter = {};
    if (req.user.role === 'siteadmin') filter.site_id = req.user.site_id;
    if (site_id) filter.site_id = site_id;
    if (from) filter.date = { $gte: new Date(from) };
    if (to) filter.date = { ...filter.date, $lte: new Date(to) };

    const materials = await Material.find(filter)
      .populate('site_id', 'name')
      .populate('created_by', 'name');
    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single material by ID
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('site_id', 'name');
    if (!material) return res.status(404).json({ message: 'Material not found.' });
    res.json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create a new material
const createMaterial = async (req, res) => {
  try {
    const { site_id, material_type, quantity, unit, rate, date, supplier_vendor, description } = req.body;
    const actualSiteId = req.user.role === 'siteadmin' ? req.user.site_id : site_id;
    if (!actualSiteId || !material_type || !quantity || !rate || !date) {
      return res.status(400).json({ message: 'site_id, material_type, quantity, rate, and date are required.' });
    }
    const newMaterial = await Material.create({
      site_id: actualSiteId,
      material_type,
      quantity,
      unit,
      total_amount: quantity * rate,
      date,
      supplier_vendor,
      description,
      created_by: req.user.id,
    });
    const populated = await newMaterial.populate('site_id', 'name').execPopulate();
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update an existing material
const updateMaterial = async (req, res) => {
  try {
    const { material_type, quantity, unit, rate, date, supplier_vendor, description } = req.body;
    const update = {
      ...(material_type && { material_type }),
      ...(quantity && { quantity }),
      ...(unit && { unit }),
      ...(rate && { total_amount: quantity * rate }),
      ...(date && { date }),
      ...(supplier_vendor && { supplier_vendor }),
      ...(description && { description })
    };
    const updated = await Material.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('site_id', 'name');
    if (!updated) return res.status(404).json({ message: 'Material not found.' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a material
const deleteMaterial = async (req, res) => {
  try {
    const deleted = await Material.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Material not found.' });
    res.json({ message: 'Material deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getMaterials, getMaterialById, createMaterial, updateMaterial, deleteMaterial };
const getMaterials = async (req, res) => {
  try {
    const { site_id, from, to } = req.query;
    let siteFilter = site_id ? parseInt(site_id) : null;

    // Site admins can only see their own site
    if (req.user.role === 'siteadmin') {
      siteFilter = req.user.site_id;
    }

    let query = `SELECT m.*, s.name as site_name, u.name as created_by_name
                 FROM materials m
                 LEFT JOIN sites s ON m.site_id = s.id
                 LEFT JOIN users u ON m.created_by = u.id
                 WHERE 1=1`;
    const params = [];

    if (siteFilter) { query += ' AND m.site_id = ?'; params.push(siteFilter); }
    if (from) { query += ' AND m.date >= ?'; params.push(from); }
    if (to) { query += ' AND m.date <= ?'; params.push(to); }
    query += ' ORDER BY m.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getMaterialById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, s.name as site_name FROM materials m 
       LEFT JOIN sites s ON m.site_id = s.id WHERE m.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Material not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { site_id, material_type, quantity, unit, rate, date, supplier_vendor, description } = req.body;
    const actualSiteId = req.user.role === 'siteadmin' ? req.user.site_id : site_id;

    if (!actualSiteId || !material_type || !quantity || !rate || !date)
      return res.status(400).json({ message: 'site_id, material_type, quantity, rate, and date are required.' });

    const [result] = await pool.query(
      `INSERT INTO materials (site_id, material_type, quantity, unit, rate, date, supplier_vendor, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [actualSiteId, material_type, quantity, unit, rate, date, supplier_vendor, description, req.user.id]
    );
    const [newRow] = await pool.query(
      'SELECT m.*, s.name as site_name FROM materials m LEFT JOIN sites s ON m.site_id = s.id WHERE m.id = ?',
      [result.insertId]
    );
    res.status(201).json(newRow[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { material_type, quantity, unit, rate, date, supplier_vendor, description } = req.body;
    await pool.query(
      `UPDATE materials SET material_type=?, quantity=?, unit=?, rate=?, date=?, supplier_vendor=?, description=?
       WHERE id=?`,
      [material_type, quantity, unit, rate, date, supplier_vendor, description, req.params.id]
    );
    const [updated] = await pool.query(
      'SELECT m.*, s.name as site_name FROM materials m LEFT JOIN sites s ON m.site_id = s.id WHERE m.id = ?',
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    await pool.query('DELETE FROM materials WHERE id = ?', [req.params.id]);
    res.json({ message: 'Material deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getMaterials, getMaterialById, createMaterial, updateMaterial, deleteMaterial };
