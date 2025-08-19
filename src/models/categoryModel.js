const mongoose = require('mongoose');
const slugify = require('slugify');


const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true
  },
  slug: String,
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: String,
  meta: {
    drugCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add slug generation middleware
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Document middleware
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


categorySchema.virtual('drugCount', {
  ref: 'Drug',
  foreignField: 'category',
  localField: '_id',
  count: true
});

module.exports = mongoose.model('Category', categorySchema);
