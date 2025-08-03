const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: [true, 'An order item must reference a drug']
  },
  name: {
    type: String,
    required: [true, 'An order item must have a name']
  },
  quantity: {
    type: Number,
    required: [true, 'An order item must have a quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'An order item must have a price']
  },
  image: String,
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'An order must belong to a user']
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: [Number]
    },
    required: [true, 'An order must have a shipping address']
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank-transfer', 'cash-on-delivery', 'wallet'],
    required: [true, 'An order must have a payment method']
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  couponDiscount: {
    type: Number,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  trackingNumber: String,
  carrier: String,
  notes: String,
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  prescriptionVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

// Document middleware
orderSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    // Check if any item requires prescription
    const drugs = await this.model('Drug').find({
      _id: { $in: this.items.map(item => item.drug) }
    });
    
    this.prescriptionRequired = drugs.some(drug => drug.requiresPrescription);
  }
  next();
});

// Query middleware
orderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email phone'
  }).populate({
    path: 'items.drug',
    select: 'name genericName images'
  });
  next();
});

// Virtuals
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().substring(18, 24).toUpperCase()}`;
});

orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Order', orderSchema);