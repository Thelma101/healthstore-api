const Drug = require('../models/drugModel');
const { cloudinary } = require('../config/cloudinary');
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

// IMAGE MANAGEMENT FUNCTIONS
const processImages = (images = []) => {
  if (!Array.isArray(images)) {
    throw new Error('Images must be an array');
  }

  const processedImages = images.map(img => ({
    url: img.url,
    caption: img.caption || '',
    isPrimary: img.isPrimary || false
  }));

  // Validate only one primary image
  const primaryCount = processedImages.filter(img => img.isPrimary).length;
  if (primaryCount > 1) {
    throw new Error('Only one image can be marked as primary');
  }

  return processedImages;
};

exports.getAllDrugs = async (req, res) => {
  try {
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

exports.createDrug = async (req, res) => {
  try {
    const { images, ...drugData } = req.body;

    const existingDrug = await Drug.findOne({ name: drugData.name });
    if (existingDrug) {
      return conflictResponse(res, 'Drug with this name already exists', [
        { field: 'name', message: 'Drug name must be unique' }
      ]);
    }

    let processedImages = [];
    if (images) {
      processedImages = processImages(images);
    }

    const newDrug = await Drug.create({
      ...drugData,
      images: processedImages
    });

    return createdResponse(res, newDrug, 'Drug created successfully');

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return validationErrorResponse(res, errors);
    }

    if (err.code === 11000) {
      return conflictResponse(res, 'Drug name already exists', [
        { field: 'name', message: 'Drug name must be unique' }
      ]);
    }

    if (err.message.includes('Images must be an array') ||
      err.message.includes('Only one image can be marked as primary')) {
      return badRequestResponse(res, err.message);
    }

    return errorResponse(res, 'Failed to create drug: ' + err.message);
  }
};

exports.updateDrug = async (req, res) => {
  try {
    const { images, ...updateData } = req.body;
    const { id } = req.params;

    const drug = await Drug.findById(id);
    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    if (updateData.name && updateData.name !== drug.name) {
      const existingDrug = await Drug.findOne({ name: updateData.name });
      if (existingDrug) {
        return conflictResponse(res, 'Drug with this name already exists', [
          { field: 'name', message: 'Drug name must be unique' }
        ]);
      }
    }

    if (images) {
      updateData.images = processImages(images);
    }

    const updatedDrug = await Drug.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    return successResponse(res, updatedDrug, 'Drug updated successfully');

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return validationErrorResponse(res, errors);
    }

    if (err.code === 11000) {
      return conflictResponse(res, 'Drug name already exists', [
        { field: 'name', message: 'Drug name must be unique' }
      ]);
    }

    if (err.message.includes('Images must be an array') ||
      err.message.includes('Only one image can be marked as primary')) {
      return badRequestResponse(res, err.message);
    }

    return errorResponse(res, 'Failed to update drug: ' + err.message);
  }
};

exports.deleteDrug = async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    // Delete all associated images from Cloudinary
    if (drug.images && drug.images.length > 0) {
      for (const image of drug.images) {
        await deleteImageFromCloudinary(image.url);
      }
    }

    // Delete the drug document
    await Drug.findByIdAndDelete(req.params.id);

    return noContentResponse(res);

  } catch (err) {
    return errorResponse(res, 'Failed to delete drug: ' + err.message);
  }
};

// IMAGE-SPECIFIC ENDPOINTS
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

    const newImages = processImages(images);

    // If any new image is primary, unset existing primary
    if (newImages.some(img => img.isPrimary)) {
      drug.images.forEach(img => { img.isPrimary = false; });
    }

    drug.images.push(...newImages);
    await drug.save();

    return successResponse(res, drug, 'Images uploaded successfully');

  } catch (err) {
    if (err.message.includes('Images must be an array') ||
      err.message.includes('Only one image can be marked as primary')) {
      return badRequestResponse(res, err.message);
    }
    return errorResponse(res, 'Failed to upload images: ' + err.message);
  }
};

// file upload to Cloudinary
exports.uploadDrugImagesDirect = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const { captions = [], isPrimary } = req.body;

    if (!files || files.length === 0) {
      return badRequestResponse(res, 'No files uploaded');
    }

    const drug = await Drug.findById(id);
    if (!drug) {
      // Clean up uploaded files if drug doesn't exist
      for (const file of files) {
        await deleteImageFromCloudinary(file.path);
      }
      return notFoundResponse(res, 'Drug not found');
    }

    const captionArray = Array.isArray(captions) ? captions :
      typeof captions === 'string' ? captions.split(',') : [];

    const newImages = files.map((file, index) => ({
      url: file.path,
      caption: captionArray[index] || '',
      isPrimary: isPrimary === file.filename ||
        (typeof isPrimary === 'string' && isPrimary.includes(file.filename))
    }));

    // If any new image is primary, unset existing primary
    if (newImages.some(img => img.isPrimary)) {
      drug.images.forEach(img => { img.isPrimary = false; });
    }

    drug.images.push(...newImages);
    await drug.save();

    return successResponse(res, drug, 'Images uploaded successfully');

  } catch (err) {
    // Clean up any uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await deleteImageFromCloudinary(file.path);
      }
    }

    if (err.message.includes('Images must be an array') ||
      err.message.includes('Only one image can be marked as primary')) {
      return badRequestResponse(res, err.message);
    }
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

    const imageToDelete = drug.images.id(imageId);
    if (!imageToDelete) {
      return notFoundResponse(res, 'Image not found');
    }

    await deleteImageFromCloudinary(imageToDelete.url);

    drug.images.pull(imageId);
    await drug.save();

    return successResponse(res, drug, 'Image deleted successfully');

  } catch (err) {
    return errorResponse(res, 'Failed to delete image: ' + err.message);
  }
};

// BULK IMAGE OPERATIONS
exports.bulkDeleteImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds)) {
      return badRequestResponse(res, 'Image IDs array is required');
    }

    const drug = await Drug.findById(id);
    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    const imagesToDelete = drug.images.filter(img =>
      imageIds.includes(img._id.toString())
    );

    for (const image of imagesToDelete) {
      await deleteImageFromCloudinary(image.url);
    }

    drug.images = drug.images.filter(img =>
      !imageIds.includes(img._id.toString())
    );

    await drug.save();

    return successResponse(res, drug, 'Images deleted successfully');

  } catch (err) {
    return errorResponse(res, 'Failed to delete images: ' + err.message);
  }
};

// SEARCH AND INVENTORY MANAGEMENT
exports.searchDrugs = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return badRequestResponse(res, 'Search query is required');
    }

    const drugs = await Drug.find({
      $text: { $search: query }
    }).select('name description category price images');

    return successResponse(res, {
      results: drugs.length,
      // quantity,
      data: drugs
    });

  } catch (err) {
    return errorResponse(res, 'Search failed: ' + err.message);
  }
};

exports.getDrugsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const drugs = await Drug.find({ category });

    return successResponse(res, {
      results: drugs.length,
      data: drugs
    });

  } catch (err) {
    return errorResponse(res, 'Failed to fetch drugs by category: ' + err.message);
  }
};

exports.checkLowStock = async (req, res) => {
  try {
    const lowStockDrugs = await Drug.find({
      quantity: { $lte: 10 }
    }).select('name quantity images');

    return successResponse(res, {
      results: lowStockDrugs.length,
      data: lowStockDrugs
    });

  } catch (err) {
    return errorResponse(res, 'Failed to check low stock: ' + err.message);
  }
};

exports.checkExpiredDrugs = async (req, res) => {
  try {
    const expiredDrugs = await Drug.find({
      expiryDate: { $lt: new Date() }
    }).select('name expiryDate quantity images');

    return successResponse(res, {
      results: expiredDrugs.length,
      data: expiredDrugs
    });

  } catch (err) {
    return errorResponse(res, 'Failed to check expired drugs: ' + err.message);
  }
};