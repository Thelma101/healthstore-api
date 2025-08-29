const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const {
  successResponse,
  noContentResponse,
  badRequestResponse,
  notFoundResponse,
  errorResponse
} = require('../utils/apiResponse');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../utils/emailService');

exports.placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    // Get user's cart with populated items
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.drug', 'name price prescriptionRequired quantity');

    if (!cart || cart.items.length === 0) {
      return badRequestResponse(res, 'Cart is empty');
    }

    // Check stock availability 
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      if (item.drug.quantity < item.quantity) {
        return badRequestResponse(res,
          `Insufficient stock for ${item.drug.name}. Only ${item.drug.quantity} available`
        );
      }

      orderItems.push({
        drug: item.drug._id,
        quantity: item.quantity,
        price: item.price,
        name: item.drug.name,
        prescriptionRequired: item.drug.prescriptionRequired
      });

      totalAmount += item.price * item.quantity;
    }

    // Check if order requires prescription
    const requiresPrescription = cart.items.some(item => item.drug.prescriptionRequired);

    if (requiresPrescription) {
      const validPrescription = await Prescription.findOne({
        user: req.user._id,
        status: 'approved',
        expiresAt: { $gt: new Date() }
      });

      if (!validPrescription) {
        return badRequestResponse(res,
          'Valid approved prescription required for this order. Please upload and get approval first.'
        );
      }

      // Attach the valid prescription to the order
      orderData.prescription = validPrescription._id;
    }

    const orderData = {
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: shippingAddress || req.user.address,
      contactInfo: {
        phone: req.user.phone,
        email: req.user.email
      },
      paymentMethod: paymentMethod || 'card',
      notes,
      prescription: req.user.prescription
    };

    const order = await Order.create(orderData);
    await order.populate('user', 'firstName lastName email phone');
    await order.populate('items.drug', 'name images');

    // Clear cart after successful order
    cart.items = [];
    await cart.save();


    const response = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      user: {
        userId: order.user._id,
        fullName: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone
      },
      items: order.items.map(item => ({
        drugId: item.drug._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.price * item.quantity,
        prescriptionRequired: item.prescriptionRequired,
        image: item.drug.images[0]?.url || null
      })),
      summary: {
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: order.totalAmount,
        totalAmount: order.totalAmount,
        totalAmountFormatted: order.totalAmountFormatted
      },
      shipping: order.shippingAddress,
      payment: {
        method: order.paymentMethod,
        status: order.paymentStatus
      },
      status: {
        current: order.status,
        formatted: order.statusFormatted
      },
      timestamps: {
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    };

    successResponse(res, response, 'Order placed successfully');



await sendOrderConfirmationEmail(
  req.user.email,
  req.user.firstName,
  {
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })),
    shippingAddress: order.shippingAddress,
    status: {
      current: order.status,
      formatted: order.statusFormatted || 'Pending'
    },
    createdAt: order.createdAt
  }
);

    // await sendOrderConfirmationEmail(
    //   req.user.email,
    //   req.user.firstName,
    //   {
    //     orderNumber: order.orderNumber,
    //     totalAmount: order.totalAmount,
    //     items: order.items,
    //     shippingAddress: order.shippingAddress,
    //     status: order.status,
    //     formatted: order.statusFormatted,
    //     createdAt: order.createdAt
    //   }
    // );

  } catch (err) {
    console.error('Error placing order:', err);
    errorResponse(res, 'Failed to place order: ' + err.message);
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('items.drug', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    const response = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: {
        current: order.status,
        formatted: order.statusFormatted
      },
      totalAmount: order.totalAmount,
      totalAmountFormatted: order.totalAmountFormatted,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    successResponse(res, {
      orders: response,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }, 'Orders retrieved successfully');

  } catch (err) {
    console.error('Error fetching orders:', err);
    errorResponse(res, 'Failed to fetch orders: ' + err.message);
  }
};


exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('items.drug', 'name images category')
      .populate('prescription', 'images status');

    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const response = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      user: {
        userId: order.user._id,
        fullName: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone
      },
      items: order.items.map(item => ({
        drugId: item.drug._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.price * item.quantity,
        prescriptionRequired: item.prescriptionRequired,
        image: item.drug.images[0]?.url || null,
        category: item.drug.category
      })),
      summary: {
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: order.totalAmount,
        totalAmount: order.totalAmount,
        totalAmountFormatted: order.totalAmountFormatted
      },
      shipping: order.shippingAddress,
      contact: order.contactInfo,
      payment: {
        method: order.paymentMethod,
        status: order.paymentStatus
      },
      status: {
        current: order.status,
        formatted: order.statusFormatted
      },
      notes: order.notes,
      prescription: order.prescription,
      timestamps: {
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    };

    successResponse(res, response, 'Order details retrieved successfully');

  } catch (err) {
    console.error('Error fetching order details:', err);
    errorResponse(res, 'Failed to fetch order details: ' + err.message);
  }
};


exports.getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin only.', 403);
    }

    const { page = 1, limit = 10, status, userId } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.user = userId;
    }

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    const response = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      user: {
        userId: order.user._id,
        fullName: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone
      },
      status: {
        current: order.status,
        formatted: order.statusFormatted
      },
      totalAmount: order.totalAmount,
      totalAmountFormatted: order.totalAmountFormatted,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    successResponse(res, {
      orders: response,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }, 'Orders retrieved successfully');

  } catch (err) {
    console.error('Error fetching all orders:', err);
    errorResponse(res, 'Failed to fetch orders: ' + err.message);
  }
};

// Admin: Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin only.', 403);
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return badRequestResponse(res, 'Valid status is required');
    }

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('items.drug', 'name quantity');

    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }

    // If approving order, check stock and deduct quantities
    if (status === 'approved' && order.status !== 'approved') {
      for (const item of order.items) {
        if (item.drug.quantity < item.quantity) {
          return badRequestResponse(res,
            `Insufficient stock for ${item.drug.name}. Only ${item.drug.quantity} available`
          );
        }

        // Deduct from stock
        item.drug.quantity -= item.quantity;
        await item.drug.save();
      }
    }

    // If cancelling approved order, restock items
    if (status === 'cancelled' && order.status === 'approved') {
      for (const item of order.items) {
        item.drug.quantity += item.quantity;
        await item.drug.save();
      }
    }

    order.status = status;
    if (notes) {
      order.notes = notes;
    }

    await order.save();

    const response = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: {
        current: order.status,
        formatted: order.statusFormatted
      },
      previousStatus: order.status,
      notes: order.notes,
      updatedAt: order.updatedAt
    };

    successResponse(res, response, 'Order status updated successfully');

    await sendOrderStatusUpdateEmail(
      order.user.email,
      order.user.firstName,
      {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        items: order.items
      },
      { formatted: oldStatus }, // Previous status
      { formatted: order.statusFormatted, current: order.status } // New status
    ); `ƒ`

  } catch (err) {
    console.error('Error updating order status:', err);
    errorResponse(res, 'Failed to update order status: ' + err.message);
  }
};


exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (!['pending', 'approved'].includes(order.status)) {
      return badRequestResponse(res, 'Order cannot be cancelled at this stage');
    }

    order.status = 'cancelled';
    await order.save();

    successResponse(res, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    }, 'Order cancelled successfully');

  } catch (err) {
    console.error('Error cancelling order:', err);
    errorResponse(res, 'Failed to cancel order: ' + err.message);
  }
};