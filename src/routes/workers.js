const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getWorkers, getWorkerById, createWorker, updateWorker, deleteWorker } = require('../controllers/workersController');

router.use(authenticate);
router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.post('/', createWorker);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;
