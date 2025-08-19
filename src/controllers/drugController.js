const Drug = require('../models/drugModel');
const {
  successResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse,
  errorResponse
} = require('../utils/apiResponse');

// Helper function for filtering, sorting, limiting fields, and pagination
const apiFeatures = async (req, query) => {
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  query = query.find(JSON.parse(queryStr));

  // 2) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // 3) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // 4) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  return query;
};

exports.getAllDrugs = async (req, res) => {
  try {
    // Execute query
    const features = await apiFeatures(req, Drug.find());
    const drugs = await features;

    return successResponse(res, {
      results: drugs.length,
      data: drugs
    });

  } catch (err) {
    return errorResponse(res, 'Failed to fetch drugs: ' + err.message);
  }
};

exports.getDrug = async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    return successResponse(res, drug);

  } catch (err) {
    return errorResponse(res, 'Failed to fetch drug: ' + err.message);
  }
};

// Add these new methods to your existing controller

exports.uploadDrugImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return badRequestResponse(res, 'Images array is required');
    }

    const drug = await Drug.findById(id);
    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    // Process new images
    const newImages = images.map(img => ({
      url: img.url,
      caption: img.caption || '',
      isPrimary: img.isPrimary || false
    }));

    // If any image is marked as primary, unset others as primary
    if (newImages.some(img => img.isPrimary)) {
      drug.images.forEach(img => { img.isPrimary = false; });
    }

    drug.images.push(...newImages);
    await drug.save();

    return successResponse(res, drug, 'Images uploaded successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to upload images: ' + err.message);
  }
};

exports.setPrimaryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const drug = await Drug.findById(id);
    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    // Find the image to set as primary
    const imageToSet = drug.images.id(imageId);
    if (!imageToSet) {
      return notFoundResponse(res, 'Image not found');
    }

    // Unset all other primary images
    drug.images.forEach(img => {
      img.isPrimary = img._id.equals(imageId);
    });

    await drug.save();

    return successResponse(res, drug, 'Primary image set successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to set primary image: ' + err.message);
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const drug = await Drug.findById(id);
    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    // Remove the image
    drug.images.pull(imageId);
    await drug.save();

    return successResponse(res, drug, 'Image deleted successfully');
  } catch (err) {
    return errorResponse(res, 'Failed to delete image: ' + err.message);
  }
};

// Update your createDrug and updateDrug methods to handle images
exports.createDrug = async (req, res) => {
  try {
    const { images = [], ...drugData } = req.body;

    // Check for existing drug
    const existingDrug = await Drug.findOne({ name: drugData.name });
    if (existingDrug) {
      return conflictResponse(res, 'Drug with this name already exists');
    }

    // Process images if provided
    const processedImages = images.map(img => ({
      url: img.url,
      caption: img.caption || '',
      isPrimary: img.isPrimary || false
    }));

    // Ensure only one primary image
    if (processedImages.filter(img => img.isPrimary).length > 1) {
      return badRequestResponse(res, 'Only one image can be primary');
    }

    const newDrug = await Drug.create({
      ...drugData,
      images: processedImages
    });

    return createdResponse(res, newDrug, 'Drug created successfully');
  } catch (err) {
    // ... existing error handling ...
  }
};

exports.updateDrug = async (req, res) => {
  try {
    const { images, ...updateData } = req.body;
    const { id } = req.params;

    // ... existing update logic ...

    if (images) {
      const processedImages = images.map(img => ({
        url: img.url,
        caption: img.caption || '',
        isPrimary: img.isPrimary || false
      }));

      // Ensure only one primary image
      if (processedImages.filter(img => img.isPrimary).length > 1) {
        return badRequestResponse(res, 'Only one image can be primary');
      }

      updateData.images = processedImages;
    }

    const updatedDrug = await Drug.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return successResponse(res, updatedDrug, 'Drug updated successfully');
  } catch (err) {
    // ... existing error handling ...
  }
};

exports.createDrug = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      quantity,
      dosage,
      prescriptionRequired,
      sideEffects,
      manufacturer,
      expiryDate
    } = req.body;

    
    const existingDrug = await Drug.findOne({ name });
    if (existingDrug) {
      return conflictResponse(res, 'Drug with this name already exists', [
        { field: 'name', message: 'Drug name must be unique' }
      ]);
    }

    const newDrug = await Drug.create({
      name,
      description,
      category,
      price,
      quantity,
      dosage,
      prescriptionRequired,
      sideEffects,
      manufacturer,
      expiryDate
    });

    return createdResponse(res, newDrug, 'Drug created successfully');

  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return validationErrorResponse(res, errors);
    }

    // Handle duplicate name error
    if (err.code === 11000) {
      return conflictResponse(res, 'Drug name already exists', [
        { field: 'name', message: 'Drug name must be unique' }
      ]);
    }

    return errorResponse(res, 'Failed to create drug: ' + err.message);
  }
};

