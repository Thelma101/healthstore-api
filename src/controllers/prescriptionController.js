const Prescription = require('../models/prescriptionModel');
const User = require('../models/userModel');
const { deleteImageFromCloudinary } = require('../config/cloudinary');

const {
  successResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  notFoundResponse,
  errorResponse
} = require('../utils/apiResponse');

exports.uploadPrescription = async (req, res) => {
  try {
    const files = req.files;
    const { notes } = req.body;

    if (!files || files.length === 0) {
      return badRequestResponse(res, 'No prescription images uploaded');
    }

    const prescriptionImages = files.map((file, index) => ({
      url: file.path,
      caption: `Prescription image ${index + 1}`,
      uploadedAt: new Date()
    }));

    const prescription = await Prescription.create({
      user: req.user._id,
      images: prescriptionImages,
      notes,
      status: 'pending'
    });

    await prescription.populate('user', 'firstName lastName email');

    const response = {
      prescriptionId: prescription._id,
      status: prescription.status,
      images: prescription.images,
      uploadedAt: prescription.createdAt,
      expiresAt: prescription.expiresAt
    };

    successResponse(res, response, 'Prescription uploaded successfully');

  } catch (err) {
    console.error('Error uploading prescription:', err);

    if (req.files) {
      for (const file of req.files) {
        await deleteImageFromCloudinary(file.path);
      }
    }

    errorResponse(res, 'Failed to upload prescription: ' + err.message);
  }
};

exports.getUserPrescriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      filter.status = status;
    }

    const prescriptions = await Prescription.find(filter)
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const response = prescriptions.map(prescription => ({
      prescriptionId: prescription._id,
      status: {
        current: prescription.status,
        formatted: prescription.statusFormatted
      },
      images: prescription.images,
      reviewedBy: prescription.reviewedBy ? {
        name: `${prescription.reviewedBy.firstName} ${prescription.reviewedBy.lastName}`,
        id: prescription.reviewedBy._id
      } : null,
      reviewedAt: prescription.reviewedAt,
      rejectionReason: prescription.rejectionReason,
      notes: prescription.notes,
      expiresAt: prescription.expiresAt,
      isExpired: prescription.isExpired,
      canBeUsed: prescription.canBeUsedForOrder(),
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt
    }));

    successResponse(res, response, 'Prescriptions retrieved successfully');

  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    errorResponse(res, 'Failed to fetch prescriptions: ' + err.message);
  }
};


exports.getPrescriptionById = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('user', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName');

    if (!prescription) {
      return notFoundResponse(res, 'Prescription not found');
    }

    // Check if user owns this prescription or is admin
    if (prescription.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const response = {
      prescriptionId: prescription._id,
      user: {
        userId: prescription.user._id,
        fullName: `${prescription.user.firstName} ${prescription.user.lastName}`,
        email: prescription.user.email,
        phone: prescription.user.phone
      },
      status: {
        current: prescription.status,
        formatted: prescription.statusFormatted
      },
      images: prescription.images,
      reviewedBy: prescription.reviewedBy ? {
        name: `${prescription.reviewedBy.firstName} ${prescription.reviewedBy.lastName}`,
        id: prescription.reviewedBy._id
      } : null,
      reviewedAt: prescription.reviewedAt,
      rejectionReason: prescription.rejectionReason,
      notes: prescription.notes,
      expiresAt: prescription.expiresAt,
      isExpired: prescription.isExpired,
      canBeUsed: prescription.canBeUsedForOrder(),
      timestamps: {
        createdAt: prescription.createdAt,
        updatedAt: prescription.updatedAt
      }
    };

    successResponse(res, response, 'Prescription retrieved successfully');

  } catch (err) {
    console.error('Error fetching prescription:', err);
    errorResponse(res, 'Failed to fetch prescription: ' + err.message);
  }
};

// Admin: Get all prescriptions
exports.getAllPrescriptions = async (req, res) => {
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

    const prescriptions = await Prescription.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(filter);
    
    const totalPrescriptions = await Prescription.countDocuments();
    const totalImages = await Prescription.aggregate([
      { $unwind: "$images" },
      { $count: "totalImages" }
    ]);

    const response = prescriptions.map(prescription => ({
      prescriptionId: prescription._id,
      user: {
        userId: prescription.user._id,
        fullName: `${prescription.user.firstName} ${prescription.user.lastName}`,
        email: prescription.user.email,
        phone: prescription.user.phone
      },
      status: {
        current: prescription.status,
        formatted: prescription.statusFormatted
      },
      images: prescription.images.map(image => ({
        imageId: image._id,
        url: image.url,
        caption: image.caption,
        uploadedAt: image.uploadedAt
      })),
      imagesCount: prescription.images.length,
      rejectionReason: prescription.rejectionReason,
      notes: prescription.notes,
      reviewedBy: prescription.reviewedBy ? {
        adminId: prescription.reviewedBy._id,
        name: `${prescription.reviewedBy.firstName} ${prescription.reviewedBy.lastName}`
      } : null,
      reviewedAt: prescription.reviewedAt,
      expiresAt: prescription.expiresAt,
      isExpired: prescription.isExpired,
      createdAt: prescription.createdAt
    }));

    successResponse(res, {
      summary: {
        totalPrescriptions: totalPrescriptions,
        totalImages: totalImages[0]?.totalImages || 0,
        prescriptionsInResponse: prescriptions.length,
        imagesInResponse: response.reduce((sum, pres) => sum + pres.imagesCount, 0)
      },
      prescriptions: response,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPrescriptions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }, 'Prescriptions retrieved successfully');

  } catch (err) {
    console.error('Error fetching all prescriptions:', err);
    errorResponse(res, 'Failed to fetch prescriptions: ' + err.message);
  }
};

// Admin: Update prescription status
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin only.', 403);
    }

    const { prescriptionId } = req.params;
    const { status, rejectionReason, notes } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return badRequestResponse(res, 'Valid status is required');
    }

    const prescription = await Prescription.findById(prescriptionId)
      .populate('user', 'firstName lastName email phone');

    if (!prescription) {
      return notFoundResponse(res, 'Prescription not found');
    }

    // If rejecting, require a reason
    if (status === 'rejected' && !rejectionReason) {
      return badRequestResponse(res, 'Rejection reason is required when rejecting a prescription');
    }

    prescription.status = status;
    prescription.reviewedBy = req.user._id;
    prescription.reviewedAt = new Date();

    if (rejectionReason) {
      prescription.rejectionReason = rejectionReason;
    }

    if (notes) {
      prescription.notes = notes;
    }

    await prescription.save();

    const response = {
      prescriptionId: prescription._id,
      status: {
        current: prescription.status,
        formatted: prescription.statusFormatted
      },
      reviewedBy: {
        adminId: req.user._id,
        adminName: `${req.user.firstName} ${req.user.lastName}`
      },
      reviewedAt: prescription.reviewedAt,
      rejectionReason: prescription.rejectionReason,
      notes: prescription.notes,
      expiresAt: prescription.expiresAt,
      isExpired: prescription.isExpired,
      canBeUsed: prescription.canBeUsedForOrder()
    };

    successResponse(res, response, 'Prescription status updated successfully');

  } catch (err) {
    console.error('Error updating prescription status:', err);
    errorResponse(res, 'Failed to update prescription status: ' + err.message);
  }
};

// Check if user has valid prescription
exports.checkValidPrescription = async (req, res) => {
  try {
    const validPrescription = await Prescription.findOne({
      user: req.user._id,
      status: 'approved',
      expiresAt: { $gt: new Date() }
    }).sort({ expiresAt: -1 });

    const response = {
      hasValidPrescription: !!validPrescription,
      prescription: validPrescription ? {
        prescriptionId: validPrescription._id,
        expiresAt: validPrescription.expiresAt,
        daysUntilExpiry: Math.ceil((validPrescription.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      } : null
    };

    successResponse(res, response, 'Prescription check completed');

  } catch (err) {
    console.error('Error checking prescription:', err);
    errorResponse(res, 'Failed to check prescription: ' + err.message);
  }
};

// Delete prescription image
exports.deletePrescriptionImage = async (req, res) => {
  try {
    const { prescriptionId, imageId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return notFoundResponse(res, 'Prescription not found');
    }

    const imageToDelete = prescription.images.id(imageId);
    if (!imageToDelete) {
      return notFoundResponse(res, 'Image not found');
    }

    // Delete from Cloudinary
    await deleteImageFromCloudinary(imageToDelete.url);

    prescription.images.pull(imageId);
    await prescription.save();

    return successResponse(res, 'Prescription image deleted successfully');

  } catch (err) {
    return errorResponse(res, 'Failed to delete prescription image: ' + err.message);
  }
};