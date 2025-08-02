
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  deactivateAccount
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
// const { authLimiter } = require('../middleware/security');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  handleValidationErrors
} = require('../middleware/validation');

// Public routes
router.post('/register', 
//   authLimiter,
//   validateUserRegistration,
//   handleValidationErrors,
  register
);

router.post('/login', 
//   authLimiter,
  validateUserLogin,
  handleValidationErrors,
  login
);

// Protected routes
router.use(protect); // All routes after this require authentication

router.get('/me', getMe);

router.put('/profile', 
  validateUserUpdate,
  handleValidationErrors,
  updateProfile
);

router.put('/change-password', changePassword);

router.post('/logout', logout);

router.delete('/deactivate', deactivateAccount);

module.exports = router;