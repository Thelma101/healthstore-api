const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendVerificationEmail } = require('../utils/emailSender');
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
    const { firstName, lastName, email, password, passwordConfirm, phone, address } = req.body;

    // 1) Validate password confirmation
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ 
          field: 'passwordConfirm', 
          message: 'Passwords do not match' 
        }]
      });
    }

    // 2) Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Registration failed',
        errors: [{ 
          field: 'email', 
          message: 'Email already registered' 
        }]
      });
    }

    // 3) Create and save user
    const newUser = await User.create({ 
      firstName, 
      lastName, 
      email, 
      password, 
      phone ,
      address: typeof address === 'string' 
        ? { street: address } // Handle string address
        : address // Handle object address
    });

    // 4) Generate and save verification token
    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    // 5) Send verification email
    await sendVerificationEmail(newUser.email, verificationToken);
    console.log(`Verification token: ${verificationToken}`);
    console.log(`Verification URL: ${process.env.CLIENT_URL}/verify-email/${verificationToken}`);


    // 6) Format response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,

      }
    });

  } catch (err) {
    // Handle validation errors
    // if (err.name === 'ValidationError') {
    //   const errors = Object.values(err.errors).map(e => ({
    //     field: e.path,
    //     message: e.message
    //   }));

    //   return res.status(400).json({
    //     success: false,
    //     message: 'Validation failed',
    //     errors
    //   });
    // }

    // Handle all other errors
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      errors: [{ message: err.message }],
      stack: err.stack
    });
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