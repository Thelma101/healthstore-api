const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: [true, 'A review must belong to a drug']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A review must belong to a user']
  },
  rating: {
    type: Number,
    required: [true, 'A review must have a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ drug: 1, user: 1 }, { unique: true });

// Query middleware
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName profileImage'
  });
  next();
});

// Static method to calculate average ratings
reviewSchema.statics.calcAverageRatings = async function(drugId) {
  const stats = await this.aggregate([
    {
      $match: { drug: drugId }
    },
    {
      $group: {
        _id: '$drug',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.model('Drug').findByIdAndUpdate(drugId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await this.model('Drug').findByIdAndUpdate(drugId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// Document middleware to update drug ratings after saving
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.drug);
});

// Document middleware to update drug ratings after removing
reviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) await doc.constructor.calcAverageRatings(doc.drug);
});

module.exports = mongoose.model('Review', reviewSchema);