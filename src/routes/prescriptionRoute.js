// routes/prescriptionRoutes.js
const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// User prescription routes
router.post('/upload', upload.array('images', 5), prescriptionController.uploadPrescription);
router.get('/my-prescriptions', prescriptionController.getUserPrescriptions);
router.get('/check-valid', prescriptionController.checkValidPrescription);
router.get('/:prescriptionId', prescriptionController.getPrescription);
router.delete('/:prescriptionId/images/:imageId', prescriptionController.deletePrescriptionImage);

// Admin only routes
router.get('/admin/all', authMiddleware.restrictTo('admin'), prescriptionController.getAllPrescriptions);
router.patch('/admin/:prescriptionId/status', authMiddleware.restrictTo('admin'), prescriptionController.updatePrescriptionStatus);

module.exports = router;