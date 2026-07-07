const Site = require('../models/Site');
const Worker = require('../models/Worker');
const Expense = require('../models/Expense');

// Get all sites with admin count, worker count, total approved expenses
const getAllSites = async (req, res) => {
  try {
    const sites = await Site.aggregate([
      {
        $lookup: {
          from: 'users', // Assuming a User collection exists
          localField: '_id',
          foreignField: 'site_id',
          as: 'admins',
        },
      },
      {
        $addFields: {
          admin_count: {
            $size: {
              $filter: {
                input: '$admins',
                as: 'admin',
                cond: { $eq: ['$$admin.role', 'siteadmin'] },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: 'site_id',
          as: 'workers',
        },
      },
      { $addFields: { worker_count: { $size: '$workers' } } },
      {
        $lookup: {
          from: 'expenses',
          let: { siteId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ['$site_id', '$$siteId'] }, { $eq: ['$status', 'approved'] } ] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          as: 'expenseAgg',
        },
      },
      {
        $addFields: {
          total_expenses: { $ifNull: [{ $arrayElemAt: ['$expenseAgg.total', 0] }, 0] },
        },
      },
      { $project: { admins: 0, workers: 0, expenseAgg: 0 } },
    ]);
    res.json(sites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single site by ID
const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found.' });
    res.json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create a new site
const createSite = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ message: 'Site name is required.' });
    const newSite = await Site.create({ name, location });
    res.status(201).json(newSite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update an existing site
const updateSite = async (req, res) => {
  try {
    const { name, location, is_active } = req.body;
    const updated = await Site.findByIdAndUpdate(
      req.params.id,
      { name, location, is_active },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Site not found.' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a site
const deleteSite = async (req, res) => {
  try {
    const result = await Site.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Site not found.' });
    res.json({ message: 'Site deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Toggle site active status
const toggleSiteStatus = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found.' });
    site.is_active = !site.is_active;
    await site.save();
    res.json({ message: `Site ${site.is_active ? 'activated' : 'deactivated'} successfully.`, is_active: site.is_active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAllSites, getSiteById, createSite, updateSite, deleteSite, toggleSiteStatus };
