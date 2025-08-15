const crypto = require('crypto');
const User = require('../models/userModel');
const {
  successResponse,
  badRequestResponse,
  errorResponse
} = require('../utils/apiResponse');

exports.verifyEmail = async (req, res) => {
  try {
    const tokenFromUrl = req.params.token;
    
    console.log('Verification attempt:', {
      token: tokenFromUrl,
      time: new Date()
    });

    const hashedToken = crypto
      .createHash('sha256')
      .update(tokenFromUrl)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpire');

    console.log('User verification status:', {
      userExists: !!user,
      storedToken: user?.emailVerificationToken,
      expiresAt: user?.emailVerificationExpire
    });

    if (!user) {
      return badRequestResponse(res, "Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.isActive = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, null, "Email verified and account activated");
  } catch (err) {
    console.error('Email verification error:', err);
    return errorResponse(res, "Email verification failed");
  }
};


exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return badRequestResponse(res, "Invalid or expired token");
    }

    return successResponse(res, { 
      email: user.email,
      isValid: true 
    }, "Token is valid");
  } catch (err) {
    console.error('Token verification error:', err);
    return errorResponse(res, "Token verification failed");
  }
};