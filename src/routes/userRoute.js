const express = require('express');
const router = express.Router();
const adminController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const logAdminAction = require('../middleware/logAdminAction');


router.use(authMiddleware.protect, adminMiddleware);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', adminController.updateUser);

router.put(
  '/users/:id',
  authMiddleware.protect,
  adminMiddleware,
  logAdminAction('update', 'user'),
  adminController.updateUser
);

router.delete(
  '/users/:id',
  authMiddleware.protect,
  adminMiddleware,
  logAdminAction('delete', 'user'),
  adminController.deleteUser
);

module.exports = router;