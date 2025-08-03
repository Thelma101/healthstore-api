const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A prescription must belong to a user']
  },
  doctorName: {
    type: String,
    required: [true, 'Please provide the doctor\'s name'],
    trim: true
  },
  doctorLicense: {
    type: String,
    trim: true
  },
  hospital: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  prescriptionDate: {
    type: Date,
    required: [true, 'Please provide the prescription date']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please provide the prescription expiry date']
  },
  images: [{
    url: String,
    publicId: String
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
  drugs: [{
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drug'
    },
    dosage: String,
    frequency: String,
    duration: String,
    notes: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
prescriptionSchema.index({ user: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ expiryDate: 1 });

// Query middleware
prescriptionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email phone'
  }).populate({
    path: 'drugs.drug',
    select: 'name genericName dosageForm strength'
  });
  next();
});

// Virtuals
prescriptionSchema.virtual('isExpired').get(function() {
  return this.expiryDate < Date.now();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);