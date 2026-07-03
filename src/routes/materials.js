const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMaterials, getMaterialById, createMaterial, updateMaterial, deleteMaterial } = require('../controllers/materialsController');

router.use(authenticate);
router.get('/', getMaterials);
router.get('/:id', getMaterialById);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

module.exports = router;
