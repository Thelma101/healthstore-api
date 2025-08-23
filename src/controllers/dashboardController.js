const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Drug = require('../models/drugModel');
const {
  successResponse,
  noContentResponse,
  badRequestResponse,
  notFoundResponse,
  errorResponse
} = require('../utils/apiResponse');

exports.getDashboardStats = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    
    if (role === 'admin') {
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        totalOrders,
        pendingOrders,
        approvedOrders,
        completedOrders,
        rejectedOrders,
        cancelledOrders,
        totalRevenue,
        totalDrugs,
        lowStockDrugs,
        outOfStockDrugs,
        prescriptionDrugs,
        nonPrescriptionDrugs
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ 
          createdAt: { $gte: new Date().setHours(0,0,0,0) } 
        }),
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({ status: 'approved' }),
        Order.countDocuments({ status: 'completed' }),
        Order.countDocuments({ status: 'rejected' }),
        Order.countDocuments({ status: 'cancelled' }),
        Order.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Drug.countDocuments(),
        Drug.countDocuments({ quantity: { $lt: 10 }, quantity: { $gt: 0 } }),
        Drug.countDocuments({ quantity: 0 }),
        Drug.countDocuments({ prescriptionRequired: true }),
        Drug.countDocuments({ prescriptionRequired: false })
      ]);

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          approved: approvedOrders,
          completed: completedOrders,
          rejected: rejectedOrders,
          cancelled: cancelledOrders,
          revenue: totalRevenue[0]?.total || 0
        },
        inventory: {
          totalDrugs,
          lowStock: lowStockDrugs,
          outOfStock: outOfStockDrugs,
          prescriptionDrugs,
          nonPrescriptionDrugs
        },
        revenue: {
          total: totalRevenue[0]?.total || 0
        }
      };

      return successResponse(res, { role, stats }, 'Admin dashboard stats retrieved');
    } else {
      const [
        totalOrders,
        pendingOrders,
        approvedOrders,
        completedOrders,
        rejectedOrders,
        cancelledOrders,
        cart
      ] = await Promise.all([
        Order.countDocuments({ user: userId }),
        Order.countDocuments({ user: userId, status: 'pending' }),
        Order.countDocuments({ user: userId, status: 'approved' }),
        Order.countDocuments({ user: userId, status: 'completed' }),
        Order.countDocuments({ user: userId, status: 'rejected' }),
        Order.countDocuments({ user: userId, status: 'cancelled' }),
        Cart.findOne({ user: userId })
      ]);

      const stats = {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          approved: approvedOrders,
          completed: completedOrders,
          rejected: rejectedOrders,
          cancelled: cancelledOrders
        },
        cart: {
          items: cart?.items?.length || 0,
          total: cart?.totalAmount || 0
        }
      };

      return successResponse(res, { role, stats }, 'User dashboard stats retrieved');
    }
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return errorResponse(res, 'Failed to fetch dashboard statistics: ' + err.message);
  }
};