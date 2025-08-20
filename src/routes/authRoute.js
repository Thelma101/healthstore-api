const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificationController = require('../controllers/verificationController');

// Public routes
router.post('/register', authController.signup);
router.post('/login', authController.login);
// router.patch('/reset-password/:token', authController.resetPassword);
// router.get('/verify-email/:token', authController.verifyEmail);
// router.post('/verify-email/:token', verificationController.verifyEmail);
// router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.resetPassword); 

router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-email/:token', verificationController.verifyEmail);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/reset-password/:token', verificationController.verifyResetToken); 

module.exports = router;

// Protected routes
router.post('/logout/:id', authController.logout);
router.patch('/update-password', authController.updatePassword);

module.exports = router;
