const Category = require('../models/categoryModel');
const Drug = require('../models/drugModel');
const { successResponse, createdResponse, noContentResponse, notFoundResponse, validationErrorResponse, conflictResponse, errorResponse } = require('../utils/apiResponse');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('parentCategory', 'name');
        return successResponse(res, { results: categories.length, data: categories });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch categories: ' + err.message);
    }
};

exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('parentCategory', 'name');
        if (!category) return notFoundResponse(res, 'Category not found');
        return successResponse(res, category);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch category: ' + err.message);
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, parentCategory, image } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return conflictResponse(res, 'Category with this name already exists');
        }

        const newCategory = await Category.create({
            name,
            description,
            parentCategory: parentCategory || null,
            image
        });

        return createdResponse(res, newCategory, 'Category created successfully');
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
            return validationErrorResponse(res, errors);
        }
        if (err.code === 11000) return conflictResponse(res, 'Category name already exists');
        return errorResponse(res, 'Failed to create category: ' + err.message);
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!category) return notFoundResponse(res, 'Category not found');
        return successResponse(res, category, 'Category updated successfully');
    } catch (err) {
        if (err.code === 11000) return conflictResponse(res, 'Category name already exists');
        return errorResponse(res, 'Failed to update category: ' + err.message);
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return notFoundResponse(res, 'Category not found');

        // Check if category has drugs
        const drugCount = await Drug.countDocuments({ category: category.name });
        if (drugCount > 0) {
            return conflictResponse(res, `Cannot delete category with ${drugCount} associated drugs`);
        }

        await Category.findByIdAndDelete(req.params.id);
        return noContentResponse(res);
    } catch (err) {
        return errorResponse(res, 'Failed to delete category: ' + err.message);
    }
};

exports.getCategoryStats = async (req, res) => {
    try {
        const stats = await Drug.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        return successResponse(res, { data: stats });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch category stats: ' + err.message);
    }
};