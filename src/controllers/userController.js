const User = require('../models/userModel');
const {
  successResponse,
  notFoundResponse,
  validationErrorResponse
} = require('../utils/apiResponse');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return successResponse(res, {
      results: users.length,
      data: users
    }, "Users retrieved successfully");
  } catch (err) {
    console.error('Get all users error:', err);
    return errorResponse(res, "Failed to retrieve users");
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return notFoundResponse(res, "User not found");
    }
    return successResponse(res, user, "User retrieved successfully");
  } catch (err) {
    console.error('Get user error:', err);
    return errorResponse(res, "Failed to retrieve user");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent role escalation from non-superadmins
    if (updates.role && req.admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: "Only superadmins can change roles"
      });
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return notFoundResponse(res, "User not found");
    }

    return successResponse(res, user, "User updated successfully");
  } catch (err) {
    console.error('Update user error:', err);
    return validationErrorResponse(res, err.errors);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return notFoundResponse(res, "User not found");
    }

    return successResponse(res, null, "User deleted successfully");
  } catch (err) {
    console.error('Delete user error:', err);
    return errorResponse(res, "Failed to delete user");
  }
};