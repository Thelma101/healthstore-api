const express = require('express');
const drugController = require('../controllers/drugController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', drugController.getAllDrugs);
router.get('/search', drugController.searchDrugs);
router.get('/category/:category', drugController.getDrugsByCategory);
router.get('/:id', drugController.getDrug);
router.post('/:id/images', drugController.uploadDrugImages);
// Protected routes (require authentication)
router.use(authMiddleware.protect);
// Add this new route
// router.get('/subcategory/:subcategory', drugController.getDrugsBySubcategory);

// Restricted to admins
// router.use(authController.restrictTo('admin', 'superadmin'));

router.post('/', drugController.createDrug);
router.patch('/:id', drugController.updateDrug);
router.delete('/:id', drugController.deleteDrug);

// Inventory management routes
router.get('/inventory/low-stock', drugController.checkLowStock);
router.get('/inventory/expired', drugController.checkExpiredDrugs);

module.exports = router;