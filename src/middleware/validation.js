const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errorMessages
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('phone')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
    
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),
    
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
    
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid zip code'),
    
  body('address.country')
    .optional()
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Country can only contain letters and spaces')
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street address cannot be empty'),
    
  body('address.city')
    .optional()
    .trim()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),
    
  body('address.zipCode')
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid zip code')
];

// Category validation rules
const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Category description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
    
  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Parent category must be a valid ID')
];

// Drug validation rules
const validateDrug = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Drug name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Drug name must be between 2 and 200 characters'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Drug description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
    
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid ID'),
    
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
    
  body('dosage.strength')
    .isFloat({ min: 0 })
    .withMessage('Dosage strength must be a positive number'),
    
  body('dosage.unit')
    .isIn(['mg', 'g', 'ml', 'mcg', 'IU', '%'])
    .withMessage('Invalid dosage unit'),
    
  body('form')
    .isIn(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'powder', 'gel', 'spray'])
    .withMessage('Invalid drug form'),
    
  body('manufacturer')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer is required')
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot exceed 100 characters'),
    
  body('stock.quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
    
  body('prescriptionRequired')
    .isBoolean()
    .withMessage('Prescription requirement must be true or false'),
    
  body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
    
  body('manufactureDate')
    .isISO8601()
    .withMessage('Manufacture date must be a valid date')
    .custom(value => {
      if (new Date(value) > new Date()) {
        throw new Error('Manufacture date cannot be in the future');
      }
      return true;
    }),
    
  body('batchNumber')
    .trim()
    .notEmpty()
    .withMessage('Batch number is required')
];

// Cart validation rules
const validateAddToCart = [
  body('drugId')
    .isMongoId()
    .withMessage('Drug ID must be valid'),
    
  body('quantity')
    .isInt({ min: 1, max: 999 })
    .withMessage('Quantity must be between 1 and 999')
];

const validateUpdateCartItem = [
  body('quantity')
    .isInt({ min: 0, max: 999 })
    .withMessage('Quantity must be between 0 and 999')
];

// Order validation rules
const validateOrder = [
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
    
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
    
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
    
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
    
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
    
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid zip code'),
    
  body('shippingAddress.phone')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('paymentMethod')
    .isIn(['cash_on_delivery', 'credit_card', 'debit_card', 'paypal', 'bank_transfer'])
    .withMessage('Invalid payment method')
];

// Parameter validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

const validateDrugId = [
  param('drugId')
    .isMongoId()
    .withMessage('Invalid drug ID format')
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'rating', 'salesCount', '-name', '-price', '-createdAt', '-rating', '-salesCount'])
    .withMessage('Invalid sort field')
];

const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
    
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid ID'),
    
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
    
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
    
  query('prescriptionRequired')
    .optional()
    .isBoolean()
    .withMessage('Prescription required must be true or false')
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateCategory,
  validateDrug,
  validateAddToCart,
  validateUpdateCartItem,
  validateOrder,
  validateObjectId,
  validateDrugId,
  validatePagination,
  validateSearch
};