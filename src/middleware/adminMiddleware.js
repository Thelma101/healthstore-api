const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required"
      });
    }

    const adminUser = await User.findById(user.id).select('+role +isActive');
    if (!adminUser || !adminUser.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account not active or not found"
      });
    }

    req.admin = adminUser;
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    return res.status(500).json({
      success: false,
      message: "Admin verification failed"
    });
  }
};

module.exports = adminMiddleware;