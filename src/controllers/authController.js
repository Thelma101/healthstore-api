const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
  conflictResponse
} = require('../utils/apiResponse');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

  user.password = undefined;

  return successResponse(res, { user }, 'Authentication successful', statusCode);
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone
    });

    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    // TODO: Send verification email
    console.log(`Verification token: ${verificationToken}`);

    return createdResponse(res, { user: newUser }, 'User created successfully');
  } catch (err) {
    if (err.code === 11000) {
      return conflictResponse(res, 'Email already exists');
    }
    return errorResponse(res, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return validationErrorResponse(res, ['Email and password are required']);
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return unauthorizedResponse(res, 'Incorrect email or password');
    }

    if (!user.isEmailVerified) {
      return unauthorizedResponse(res, 'Please verify your email first');
    }

    return createSendToken(user, 200, req, res);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  return successResponse(res, null, 'Logged out successfully');
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return notFoundResponse(res, 'User not found with that email');
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send password reset email
    console.log(`Reset token: ${resetToken}`);

    return successResponse(res, null, 'Password reset token sent to email');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() }
    });

    if (!user) {
      return badRequestResponse(res, 'Token is invalid or has expired');
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    return createSendToken(user, 200, req, res);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return unauthorizedResponse(res, 'Your current password is wrong');
    }

    user.password = req.body.newPassword;
    await user.save();

    return createSendToken(user, 200, req, res);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};