const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: [true, 'A cart item must reference a drug']
  },
  quantity: {
    type: Number,
    required: [true, 'A cart item must have a quantity'],
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Maximum quantity per item is 10']
  },
  price: {
    type: Number,
    required: [true, 'A cart item must have a price']
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ user: 1 });

// Virtuals
cartSchema.virtual('userDisplayName').get(function() {
  if (this.user && this.user.firstName && this.user.lastName) {
    return `${this.user.firstName} ${this.user.lastName}`;
  }
  return 'Unknown User';
});

cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

cartSchema.virtual('total').get(function() {
  const subtotal = this.subtotal;
  const discount = this.coupon ? this.coupon.discount : 0;
  return subtotal - discount;
});

cartSchema.virtual('formattedTotal').get(function() {
  return this.totalAmount ? `₦${this.totalAmount.toLocaleString()}` : '₦0';
});

// Document middleware
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Query middleware
cartSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'items.drug',
    select: 'name price images requiresPrescription'
  });
  next();
});

module.exports = mongoose.model('Cart', cartSchema);