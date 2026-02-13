const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificationController = require('../controllers/verificationController');

const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-email/:token', verificationController.verifyEmail);
router.get('/reset-password/:token', verificationController.verifyResetToken);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.post('/logout', authMiddleware.protect, authController.logout);
router.patch('/update-password', authMiddleware.protect, authController.updatePassword);

module.exports = router;
