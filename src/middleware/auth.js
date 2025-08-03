// middleware/auth.js
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');

exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return apiResponse.unauthorized(res, 'Authentication token missing');

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[JWT Error]', err.message);
    return apiResponse.unauthorized(res, 'Invalid or expired token');
  }
};

exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role))
      return apiResponse.forbidden(res, 'Access denied for this role');

    next();
  };
};
