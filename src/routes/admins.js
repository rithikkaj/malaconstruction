const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAllAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin, toggleAdminStatus, resetAdminPassword } = require('../controllers/adminsController');

router.use(authenticate, requireRole('superadmin'));
router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);
router.patch('/:id/toggle', toggleAdminStatus);
router.patch('/:id/reset-password', resetAdminPassword);

module.exports = router;
