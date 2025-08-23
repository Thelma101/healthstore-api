const User = require('../models/userModel');
const {
  successResponse,
  notFoundResponse,
  noContentResponse,
  validationErrorResponse,
  errorResponse
} = require('../utils/apiResponse');

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) filteredObj[key] = obj[key];
  });
  return filteredObj;
};

// Authentication-related functions
exports.registerUser = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    return successResponse(res, { user: newUser }, 'User registered successfully', 201);
  } catch (err) {
    if (err.code === 11000) {
      return validationErrorResponse(res, ['Email already exists']);
    }
    return errorResponse(res, err.message);
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return validationErrorResponse(res, ['Invalid credentials']);
    }
    
    const token = user.generateAuthToken();
    return successResponse(res, { token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.logoutUser = async (req, res) => {
  try {
    // Implementation depends on your auth system
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// User profile functions
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    return successResponse(res, { user });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    if (req.body.password) {
      return validationErrorResponse(res, [
        'This route is not for password updates'
      ]);
    }

    const filteredBody = filterObj(
      req.body,
      'firstName',
      'lastName',
      'email',
      'phone'
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    return successResponse(res, { user: updatedUser });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// Admin functions
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return successResponse(res, { users });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    return successResponse(res, { user });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    return successResponse(res, { user });
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    return noContentResponse(res);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// Password reset functions
exports.forgotPassword = async (req, res) => {
  try {
    // Implement password reset logic
    return successResponse(res, null, 'Password reset email sent');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Implement password reset logic
    return successResponse(res, null, 'Password reset successful');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    // Implement email verification logic
    return successResponse(res, null, 'Email verified successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};