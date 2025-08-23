const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/', orderController.placeOrder);
router.get('/', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderDetails);
router.patch('/:orderId/cancel', orderController.cancelOrder);

router.get('/admin/all', authMiddleware.restrictTo('admin'), orderController.getAllOrders);
router.patch('/admin/:orderId/status', authMiddleware.restrictTo('admin'), orderController.updateOrderStatus);

// orders?status=approved&page=2&limit=5
// GET /api/v1/orders?page=1&limit=10&status=pending
// GET /api/v1/orders?status=approved&page=2&limit=5
// GET /api/v1/orders?status=completed
// GET /api/v1/orders?page=1&limit=20

module.exports = router;