// controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    if (await User.findOne({ email }))
      return apiResponse.conflict(res, 'Email already registered');

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 12),
      phone,
      address
    });

    const token = generateToken(user);

    return apiResponse.created(res, 'Registration successful', {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Register Error]', err.message);
    return apiResponse.serverError(res, 'Failed to register user');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return apiResponse.unauthorized(res, 'Invalid email or password');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return apiResponse.unauthorized(res, 'Invalid email or password');

    const token = generateToken(user);
    user.lastLogin = Date.now();
    await user.save();

    return apiResponse.success(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    return apiResponse.serverError(res, 'Failed to login');
  }
};





// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User'); // Use your existing model

// // ==== CONFIG ====
// const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
// const JWT_EXPIRES_IN = '7d';

// // ==== TOKEN + RESPONSE UTILS ====

// const createToken = user =>
//   jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// const createTokenResponse = user => ({
//   token: createToken(user),
//   user: {
//     id: user._id,
//     email: user.email,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     phone: user.phone,
//     address: user.address,
//     role: user.role
//   }
// });

// const response = {
//   success: (res, data, msg = 'Success') =>
//     res.status(200).json({ success: true, message: msg, data }),

//   created: (res, data, msg = 'Created') =>
//     res.status(201).json({ success: true, message: msg, data }),

//   badRequest: (res, msg = 'Bad Request', errors = []) =>
//     res.status(400).json({ success: false, message: msg, errors }),

//   unauthorized: (res, msg = 'Unauthorized') =>
//     res.status(401).json({ success: false, message: msg }),

//   conflict: (res, msg = 'Conflict') =>
//     res.status(409).json({ success: false, message: msg }),

//   error: (res, msg = 'Server Error', code = 500) =>
//     res.status(code).json({ success: false, message: msg }),

//   403: (res, msg = 'Server Error', code = 403) =>
//     res.status(code).json({ success: false, message: msg }),

//   forbidden: (res, msg = 'Forbidden') =>
//   res.status(403).json({ success: false, message: msg }),

  
// };

// // ==== HELPERS ====

// const extractValidationErrors = error =>
//   Object.values(error.errors).map(err => ({
//     field: err.path,
//     message: err.message
//   }));

// const buildUserUpdates = body => {
//   const fields = ['firstName', 'lastName', 'phone', 'address'];
//   const updates = {};
//   for (const field of fields) {
//     if (body[field]) updates[field] = body[field];
//   }
//   return updates;
// };

// // ==== CONTROLLERS ====

// const register = async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, phone, address } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser) return response.conflict(res, 'User with this email already exists');

//     const user = await User.create({ firstName, lastName, email, password, phone, address });
//     return response.created(res, createTokenResponse(user), 'User registered successfully');
//   } catch (error) {
//     console.error('Register error:', error);

//     if (error.name === 'ValidationError')
//       return response.badRequest(res, 'Validation error', extractValidationErrors(error));

//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return response.conflict(res, `${field} already exists`);
//     }

//     return response.error(res, 'Error registering user');
//   }
// };

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select('+password');
//     if (!user || !user.isActive)
//       return response.unauthorized(res, 'Invalid email or password');

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch)
//       return response.unauthorized(res, 'Invalid email or password');

//     user.lastLogin = new Date();
//     await user.save({ validateBeforeSave: false });

//     return response.success(res, createTokenResponse(user), 'Login successful');
//   } catch (error) {
//     console.error('Login error:', error);
//     return response.error(res, 'Error logging in');
//   }
// };

// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) return response.unauthorized(res, 'User not found');
//     return response.success(res, { user }, 'User profile retrieved successfully');
//   } catch (error) {
//     console.error('Get me error:', error);
//     return response.error(res, 'Error retrieving profile');
//   }
// };

// const updateProfile = async (req, res) => {
//   try {
//     const updates = buildUserUpdates(req.body);
//     if (!Object.keys(updates).length)
//       return response.badRequest(res, 'No valid fields to update');

//     const user = await User.findByIdAndUpdate(req.user.id, updates, {
//       new: true,
//       runValidators: true
//     });

//     if (!user) return response.unauthorized(res, 'User not found');
//     return response.success(res, { user }, 'Profile updated successfully');
//   } catch (error) {
//     console.error('Update profile error:', error);

//     if (error.name === 'ValidationError')
//       return response.badRequest(res, 'Validation error', extractValidationErrors(error));

//     return response.error(res, 'Error updating profile');
//   }
// };

// const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     if (!currentPassword || !newPassword)
//       return response.badRequest(res, 'Both current and new passwords are required');

//     const user = await User.findById(req.user.id).select('+password');
//     if (!user) return response.unauthorized(res, 'User not found');

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch)
//       return response.unauthorized(res, 'Current password is incorrect');

//     const isSame = await user.comparePassword(newPassword);
//     if (isSame)
//       return response.badRequest(res, 'New password must differ from current');

//     user.password = newPassword;
//     await user.save();

//     return response.success(res, null, 'Password changed successfully');
//   } catch (error) {
//     console.error('Change password error:', error);
//     return response.error(res, 'Error changing password');
//   }
// };

// const logout = async (_req, res) => {
//   try {
//     // In JWT-based systems, logout is typically handled on the client side.
//     return response.success(res, null, 'Logged out successfully');
//   } catch (error) {
//     console.error('Logout error:', error);
//     return response.error(res, 'Error logging out');
//   }
// };

// const deactivateAccount = async (req, res) => {
//   try {
//     const { password } = req.body;
//     if (!password) return response.badRequest(res, 'Password is required');

//     const user = await User.findById(req.user.id).select('+password');
//     if (!user) return response.unauthorized(res, 'User not found');

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch)
//       return response.unauthorized(res, 'Incorrect password');

//     user.isActive = false;
//     await user.save({ validateBeforeSave: false });

//     return response.success(res, null, 'Account deactivated successfully');
//   } catch (error) {
//     console.error('Deactivate account error:', error);
//     return response.error(res, 'Error deactivating account');
//   }
// };

// module.exports = {
//   register,
//   login,
//   getMe,
//   updateProfile,
//   changePassword,
//   logout,
//   deactivateAccount
// };
