const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAllSites, getSiteById, createSite, updateSite, deleteSite, toggleSiteStatus } = require('../controllers/sitesController');

router.use(authenticate);
router.get('/', getAllSites);
router.get('/:id', getSiteById);
router.post('/', requireRole('superadmin'), createSite);
router.put('/:id', requireRole('superadmin'), updateSite);
router.delete('/:id', requireRole('superadmin'), deleteSite);
router.patch('/:id/toggle', requireRole('superadmin'), toggleSiteStatus);

module.exports = router;
