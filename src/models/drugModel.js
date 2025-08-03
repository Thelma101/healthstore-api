const mongoose = require('mongoose');
const slugify = require('slugify');

const drugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A drug must have a name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Drug name cannot exceed 100 characters'],
    minlength: [3, 'Drug name must have at least 3 characters']
  },
  slug: String,
  genericName: {
    type: String,
    required: [true, 'A drug must have a generic name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'A drug must have a description'],
    trim: true
  },
  summary: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'A drug must belong to a category']
  },
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  manufacturer: {
    type: String,
    required: [true, 'A drug must have a manufacturer']
  },
  batchNumber: {
    type: String,
    required: [true, 'A drug must have a batch number']
  },
  barcode: {
    type: String,
    unique: true
  },
  sku: {
    type: String,
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'A drug must have a price'],
    min: [0, 'Price must be above 0']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be below regular price'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'A drug must have a quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  dosageForm: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Suppository', 'Other'],
    required: [true, 'A drug must have a dosage form']
  },
  strength: {
    value: Number,
    unit: String
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  sideEffects: [String],
  contraindications: [String],
  expiryDate: {
    type: Date,
    required: [true, 'A drug must have an expiry date']
  },
  images: [String],
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  lastRestocked: Date,
  restockThreshold: {
    type: Number,
    default: 10
  },
  tags: [String],
  meta: {
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    }
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
drugSchema.index({ price: 1, ratingsAverage: -1 });
drugSchema.index({ slug: 1 });
drugSchema.index({ name: 'text', genericName: 'text', description: 'text' });

// Document middleware
drugSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query middleware
drugSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'category',
    select: 'name description'
  }).populate({
    path: 'subCategories',
    select: 'name'
  });
  next();
});

// Virtual populate
drugSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'drug',
  localField: '_id'
});

drugSchema.virtual('isExpired').get(function() {
  return this.expiryDate < Date.now();
});

drugSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.restockThreshold;
});

// Instance method
drugSchema.methods.isPrescriptionRequired = function() {
  return this.requiresPrescription || this.dosageForm === 'Injection';
};

module.exports = mongoose.model('Drug', drugSchema);