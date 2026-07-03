const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense, approveExpense, rejectExpense } = require('../controllers/expensesController');

router.use(authenticate);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', requireRole('superadmin'), deleteExpense);
router.patch('/:id/approve', requireRole('superadmin'), approveExpense);
router.patch('/:id/reject', requireRole('superadmin'), rejectExpense);

module.exports = router;
