const crypto = require('crypto');
const User = require('../models/userModel');
const { 
  successResponse,
  badRequestResponse,
  errorResponse 
} = require('../utils/apiResponse');

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    console.log('Email verification:', {
      inputToken: token,
      hashedToken,
      storedToken: user?.emailVerificationToken,
      isValid: !!user,
      expiresAt: user?.emailVerificationExpire
        ? new Date(user.emailVerificationExpire)
        : null
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
    return errorResponse(res, 'Verification failed');
  }
};