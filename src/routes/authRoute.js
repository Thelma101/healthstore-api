
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
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  handleValidationErrors
} = require('../middleware/validation');

// Public routes - NO MIDDLEWARE BLOCKING
router.post('/register', register);
router.post('/login', login);

// GET route for registration info
router.get('/register', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Registration endpoint information',
    data: {
      method: 'POST',
      endpoint: '/api/v1/auth/register',
      requiredFields: {
        firstName: 'string (2-50 characters)',
        lastName: 'string (2-50 characters)',
        email: 'string (valid email format)',
        password: 'string (min 6 characters, must contain uppercase, lowercase, and number)',
        phone: 'string (valid phone format)',
        address: {
          street: 'string',
          city: 'string',
          state: 'string',
          zipCode: 'string (5 digits or 5+4 format)',
          country: 'string (optional, defaults to USA)'
        }
      },
      example: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      }
    }
  });
});

// Protected routes
router.use(protect);

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);
router.delete('/deactivate', deactivateAccount);

module.exports = router;