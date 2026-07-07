const Worker = require('../models/Worker');
const Site = require('../models/Site');
const User = require('../models/User'); // Assuming a User model exists

// Get workers with optional filters and populate site & creator
const getWorkers = async (req, res) => {
  try {
    const { site_id, from, to } = req.query;
    const filter = {};
    if (req.user.role === 'siteadmin') filter.site_id = req.user.site_id;
    if (site_id) filter.site_id = site_id;
    if (from) filter.work_period_start = { $gte: new Date(from) };
    if (to) filter.work_period_end = { $lte: new Date(to) };

    const workers = await Worker.find(filter)
      .populate('site_id', 'name')
      .populate('created_by', 'name');
    res.json(workers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single worker by ID
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('site_id', 'name')
      .populate('created_by', 'name');
    if (!worker) return res.status(404).json({ message: 'Worker not found.' });
    res.json(worker);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create a new worker
const createWorker = async (req, res) => {
  try {
    const { site_id, name, profession, daily_wage, days_worked, work_period_start, work_period_end } = req.body;
    const actualSiteId = req.user.role === 'siteadmin' ? req.user.site_id : site_id;
    if (!actualSiteId || !name || !profession || !daily_wage || days_worked === undefined) {
      return res.status(400).json({ message: 'site_id, name, profession, daily_wage, and days_worked are required.' });
    }
    const newWorker = await Worker.create({
      site_id: actualSiteId,
      name,
      profession,
      daily_wage,
      days_worked,
      work_period_start,
      work_period_end,
      created_by: req.user.id,
    });
    const populated = await newWorker.populate('site_id', 'name').populate('created_by', 'name').execPopulate();
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update an existing worker
const updateWorker = async (req, res) => {
  try {
    const update = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('site_id', 'name').populate('created_by', 'name');
    if (!update) return res.status(404).json({ message: 'Worker not found.' });
    res.json(update);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a worker
const deleteWorker = async (req, res) => {
  try {
    const result = await Worker.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Worker not found.' });
    res.json({ message: 'Worker deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker };
