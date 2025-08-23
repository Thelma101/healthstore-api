const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,
  notes: String,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

// Indexes
prescriptionSchema.index({ user: 1, status: 1 });
prescriptionSchema.index({ status: 1, createdAt: 1 });
prescriptionSchema.index({ expiresAt: 1 });

// Virtuals
prescriptionSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

prescriptionSchema.virtual('statusFormatted').get(function() {
  return this.status.charAt(0).toUpperCase() + this.status.slice(1);
});

// Methods
prescriptionSchema.methods.canBeUsedForOrder = function() {
  return this.status === 'approved' && !this.isExpired;
};

module.exports = mongoose.model('Prescription', prescriptionSchema);