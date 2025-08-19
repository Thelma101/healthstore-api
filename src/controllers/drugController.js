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

    // Check for existing drug with same name
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

exports.updateDrug = async (req, res) => {
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

    // Check if drug exists
    const drug = await Drug.findById(req.params.id);
    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    // Check for name conflict with other drugs
    if (name && name !== drug.name) {
      const existingDrug = await Drug.findOne({ name });
      if (existingDrug) {
        return conflictResponse(res, 'Drug with this name already exists', [
          { field: 'name', message: 'Drug name must be unique' }
        ]);
      }
    }

    const updatedDrug = await Drug.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        price,
        quantity,
        dosage,
        prescriptionRequired,
        sideEffects,
        manufacturer,
        expiryDate,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    return successResponse(res, updatedDrug, 'Drug updated successfully');

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

    return errorResponse(res, 'Failed to update drug: ' + err.message);
  }
};

exports.deleteDrug = async (req, res) => {
  try {
    const drug = await Drug.findByIdAndDelete(req.params.id);

    if (!drug) {
      return notFoundResponse(res, 'Drug not found');
    }

    return noContentResponse(res);

  } catch (err) {
    return errorResponse(res, 'Failed to delete drug: ' + err.message);
  }
};

exports.searchDrugs = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return badRequestResponse(res, 'Search query is required');
    }

    const drugs = await Drug.find({
      $text: { $search: query }
    }).select('name description category price');

    return successResponse(res, {
      results: drugs.length,
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
      quantity: { $lte: 10 } // Assuming 10 is the threshold for low stock
    }).select('name quantity');

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
    }).select('name expiryDate quantity');

    return successResponse(res, {
      results: expiredDrugs.length,
      data: expiredDrugs
    });

  } catch (err) {
    return errorResponse(res, 'Failed to check expired drugs: ' + err.message);
  }
};