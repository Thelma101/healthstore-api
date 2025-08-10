const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendEmail } = require('../utils/emailSender');
const {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
  conflictResponse,
  forbiddenResponse
} = require('../utils/apiResponse');
const { generateToken, setTokenCookie } = require('../utils/generateToken');

const createSendToken = (user, statusCode, req, res) => {
  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role
  });

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
    console.log('Request Body:', req.body); // Debug log
    console.log('Headers:', req.headers); // Check content-type
    
    // 1) Validate password confirmation
    if (password !== passwordConfirm) {
      return validationErrorResponse(res, [
        { field: 'passwordConfirm', message: 'Passwords do not match' }
      ]);
    }

    // 2) Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflictResponse(res, 'Email already registered', [
        { field: 'email', message: 'Email already registered' }
      ]);
    }

    // 3) Create and save user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address: typeof address === 'string' ? { street: address } : address
    });

    // 4) Generate and save verification token
    const verificationToken = newUser.createEmailVerificationToken();
    console.log('Generated verification token:', verificationToken);
    console.log('User firstName:', newUser.firstName);
    await newUser.save({ validateBeforeSave: false });

    // 5) Send verification email
    console.log('Sending verification email to:', newUser.email);
    await sendEmail(newUser.email, newUser.firstName, verificationToken);

    // 6) Format response (remove sensitive data)
    const userData = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone
    };

    return createdResponse(res, userData, 'Registration successful! Check your email to verify your account.');

  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return validationErrorResponse(res, errors);
    }

    // Handle duplicate email error
    if (err.code === 11000) {
      return conflictResponse(res, 'Email already registered', [
        { field: 'email', message: 'Email already registered' }
      ]);
    }

    return errorResponse(res, 'Registration failed: ' + err.message);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    // 1) Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2) Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return badRequestResponse(res, 'Verification token is invalid or expired');
    }

    // 3) Mark as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // 4) Return JSON response (no redirect)
    return successResponse(res, null, 'Email verified successfully');

  } catch (err) {
    return errorResponse(res, 'Verification failed: ' + err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Validate input
    if (!email || !password) {
      return validationErrorResponse(res, [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]);
    }

    // 2) Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    // 3) Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    // 4) Check if email is verified
    if (!user.isEmailVerified) {
      return forbiddenResponse(res, 'Please verify your email first', [
        { field: 'email', message: 'Please verify your email first' }
      ]);
    }

    // 5) Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // 6) Set cookie
    setTokenCookie(res, token);

    // 7) Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 8) Format response
    const userData = {
      id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    return successResponse(res, { user: userData, token }, 'Login successful');

  } catch (err) {
    return errorResponse(res, 'Login failed: ' + err.message);
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

    if (!(await user.verifyPassword(req.body.currentPassword))) {
      return unauthorizedResponse(res, 'Your current password is wrong');
    }

    user.password = req.body.newPassword;
    await user.save();

    return createSendToken(user, 200, req, res);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};