const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

// Public routes
router.post('/register', apiLimiter, authController.signup);
router.post('/login', apiLimiter, authController.login);
router.post('/forgot-password', apiLimiter, authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes (require valid JWT)
router.post('/logout', authController.logout);
router.patch('/update-password', authController.updatePassword);

module.exports = router;