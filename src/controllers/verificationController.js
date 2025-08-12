const User = require('../models/userModel');
const { 
  successResponse,
  badRequestResponse,
  errorResponse 
} = require('../utils/apiResponse');
const { 
  generateVerificationToken,
  verifyToken
} = require('../utils/tokenUtils');

module.exports = {
  /**
   * Email verification for registration
   */
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({
        emailVerificationToken: { $exists: true },
        emailVerificationExpire: { $gt: Date.now() }
      });

      if (!user || !verifyToken(token, user.emailVerificationToken)) {
        return badRequestResponse(res, 'Invalid or expired verification token');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save();

      return successResponse(res, null, 'Email verified successfully');
    } catch (err) {
      return errorResponse(res, 'Verification failed: ' + err.message);
    }
  },

  /**
   * Password reset verification
   */
  verifyPasswordReset: async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await User.findOne({
        passwordResetToken: { $exists: true },
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user || !verifyToken(token, user.passwordResetToken)) {
        return badRequestResponse(res, 'Invalid or expired reset token');
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return successResponse(res, null, 'Password reset successfully');
    } catch (err) {
      return errorResponse(res, 'Password reset failed: ' + err.message);
    }
  }
};