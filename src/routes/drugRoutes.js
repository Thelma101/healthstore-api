const express = require('express');
const drugController = require('../controllers/drugController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/', drugController.getAllDrugs);
router.get('/search', drugController.searchDrugs);
router.get('/category/:category', drugController.getDrugsByCategory);
router.get('/:id', drugController.getDrug);

// Protected routes (require authentication)
router.use(authController.protect);

// Restricted to admin and pharmacist roles
router.use(authController.restrictTo('admin', 'pharmacist'));

router.post('/', drugController.createDrug);
router.patch('/:id', drugController.updateDrug);
router.delete('/:id', drugController.deleteDrug);

// Inventory management routes
router.get('/inventory/low-stock', drugController.checkLowStock);
router.get('/inventory/expired', drugController.checkExpiredDrugs);

module.exports = router;