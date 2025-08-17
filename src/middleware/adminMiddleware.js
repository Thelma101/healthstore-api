const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {
  try {
    // 1. Get user from request (assuming you attach user during auth)
    const user = req.user;
    
    // 2. Verify admin role
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required"
      });
    }

    // 3. Additional admin verification if needed
    const adminUser = await User.findById(user.id).select('+role +isActive');
    if (!adminUser || !adminUser.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account not active or not found"
      });
    }

    // 4. Attach full admin user object if needed
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