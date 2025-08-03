exports.success = (res, message, data = {}) => {
  return res.status(200).json({ success: true, message, data });
};

exports.created = (res, message, data = {}) => {
  return res.status(201).json({ success: true, message, data });
};

exports.conflict = (res, message) => {
  return res.status(409).json({ success: false, message });
};

exports.unauthorized = (res, message) => {
  return res.status(401).json({ success: false, message });
};

exports.forbidden = (res, message) => {
  return res.status(403).json({ success: false, message });
};

exports.serverError = (res, message = 'Server error') => {
  return res.status(500).json({ success: false, message });
};


exports.successResponse = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

exports.createdResponse = (res, message, data = {}) => {
  return res.status(201).json({
    success: true,
    message,
    data
  });
};

exports.errorResponse = (res, message, code = 500) => {
  return res.status(code).json({
    success: false,
    message
  });
};
