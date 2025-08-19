const express = require('express');
const drugController = require('../controllers/drugController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', drugController.getAllDrugs);
router.get('/search', drugController.searchDrugs);
router.get('/category/:category', drugController.getDrugsByCategory);
router.get('/:id', drugController.getDrug);
// router.post('/:id/images', drugController.uploadDrugImages);
// Protected routes (require authentication)
router.use(authMiddleware.protect);
// Add this new route
// router.get('/subcategory/:subcategory', drugController.getDrugsBySubcategory);

// Restricted to admins
// router.use(authController.restrictTo('admin', 'superadmin'));

router.post('/', 
  authMiddleware.protect, 
  authMiddleware.restrictTo('admin', 'pharmacist'),
  drugController.createDrug
);

router.patch('/:id', 
  authMiddleware.protect,
  authMiddleware.restrictTo('admin', 'pharmacist'),
  drugController.updateDrug
);

router.post('/', drugController.createDrug);
router.patch('/:id', drugController.updateDrug);
router.delete('/:id', drugController.deleteDrug);

// Inventory management routes
router.get('/inventory/low-stock', drugController.checkLowStock);
router.get('/inventory/expired', drugController.checkExpiredDrugs);

// Cloudinary direct upload routes
router.post('/:id/images/upload',
  authMiddleware.restrictTo('admin', 'pharmacist'),
  upload.array('images', 5), // Max 5 images
  drugController.uploadDrugImagesDirect
);

// Keep the existing URL-based image upload for flexibility
router.post('/:id/images',
  authMiddleware.restrictTo('admin', 'pharmacist'),
  drugController.uploadDrugImages
);

module.exports = router;