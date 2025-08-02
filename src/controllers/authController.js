const User = require('../models/User');
const { createTokenResponse } = require('../utils/jwt');
const {
  successResponse,
  errorResponse,
  createdResponse,
  badRequestResponse,
  unauthorizedResponse,
  conflictResponse
} = require('../utils/apiResponse');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflictResponse(res, 'User with this email already exists');
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address
    });

    // Generate token response
    const tokenResponse = createTokenResponse(user, true);

    return createdResponse(res, tokenResponse, 'User registered successfully');
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return badRequestResponse(res, 'Validation error', errors);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return conflictResponse(res, `${field} already exists`);
    }

    return errorResponse(res, 'Error registering user', 500);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      return unauthorizedResponse(res, 'Your account has been deactivated. Please contact support.');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token response
    const tokenResponse = createTokenResponse(user, true);

    return successResponse(res, tokenResponse, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Error logging in', 500);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    return successResponse(res, { user }, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Get me error:', error);
    return errorResponse(res, 'Error retrieving user profile', 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};
    const allowedFields = ['firstName', 'lastName', 'phone', 'address'];
    
    // Only include allowed fields that are present in request
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
      return badRequestResponse(res, 'No valid fields provided for update');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    return successResponse(res, { user }, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return badRequestResponse(res, 'Validation error', errors);
    }

    return errorResponse(res, 'Error updating profile', 500);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return badRequestResponse(res, 'Current password and new password are required');
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordCorrect) {
      return unauthorizedResponse(res, 'Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return badRequestResponse(res, 'New password must be different from current password');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return badRequestResponse(res, 'Validation error', errors);
    }

    return errorResponse(res, 'Error changing password', 500);
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // Here we can log the logout event or perform cleanup if needed
    
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 'Error logging out', 500);
  }
};

// @desc    Deactivate user account
// @route   DELETE /api/auth/deactivate
// @access  Private
const deactivateAccount = async (req, res) => {
  try {
    const { password, reason } = req.body;

    if (!password) {
      return badRequestResponse(res, 'Password is required to deactivate account');
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return unauthorizedResponse(res, 'Incorrect password');
    }

    // Deactivate account
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, null, 'Account deactivated successfully');
  } catch (error) {
    console.error('Deactivate account error:', error);
    return errorResponse(res, 'Error deactivating account', 500);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  deactivateAccount
};