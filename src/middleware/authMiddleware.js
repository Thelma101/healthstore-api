const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/apiResponse');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return unauthorizedResponse(res, 'Not authorized, no token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select('-password');
    
    if (!currentUser) {
      return unauthorizedResponse(res, 'User not found');
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return unauthorizedResponse(res, 'Password changed, please log in again');
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return unauthorizedResponse(res, error.message || 'Not authorized');
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return forbiddenResponse(res, 'You do not have permission');
    }
    next();
  };
};

