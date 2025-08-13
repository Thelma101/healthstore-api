const crypto = require('crypto');
const User = require('../models/userModel');
const { 
  successResponse,
  badRequestResponse,
  errorResponse 
} = require('../utils/apiResponse');

module.exports = {
  /**
   * Email verification for registration
   */
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      // Hash the token from URL to match what's stored
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() }
      });

      if (!user) {
        return badRequestResponse(res, 'Invalid or expired verification token');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save();

      return successResponse(res, null, 'Email verified successfully');
    } catch (err) {
      console.error('Email verification error:', err);
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

      if (!password) {
        return badRequestResponse(res, 'New password is required');
      }

      // Hash the token from URL to match what's stored
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return badRequestResponse(res, 'Invalid or expired reset token');
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return successResponse(res, null, 'Password reset successfully');
    } catch (err) {
      console.error('Password reset verification error:', err);
      return errorResponse(res, 'Password reset failed: ' + err.message);
    }
  }
};