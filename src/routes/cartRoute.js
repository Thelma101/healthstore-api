const express = require('express');
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// Cart operations
router.get('/', cartController.getCart);
router.get('/summary', cartController.getCartSummary);
router.post('/items', cartController.addToCart);
router.patch('/items/:itemId', cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;