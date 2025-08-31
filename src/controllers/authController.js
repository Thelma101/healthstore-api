const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
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


exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordConfirm, phone, address } = req.body;
    console.log('Request Body:', req.body);
    console.log('Headers:', req.headers);

    if (password !== passwordConfirm) {
      return validationErrorResponse(res, [
        { field: 'passwordConfirm', message: 'Passwords do not match' }
      ]);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflictResponse(res, 'Email already registered', [
        { field: 'email', message: 'Email already registered' }
      ]);
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address: typeof address === 'string' ? { street: address } : address
    });

    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    console.log('=== REGISTRATION DEBUG ===');
    console.log('Plain verification token:', verificationToken);
    console.log('Hashed token in DB:', newUser.emailVerificationToken);
    console.log('Token expires at:', newUser.emailVerificationExpire);
    console.log('Current time:', new Date());

    console.log('Sending verification email to:', newUser.email);
    await sendVerificationEmail(newUser.email, newUser.firstName, verificationToken);

    const jwtToken = generateToken({ id: newUser._id });

    const userData = {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        isActive: newUser.isActive
      },
      auth: {
        token: jwtToken,
        expiresIn: process.env.JWT_EXPIRES_IN,
        verificationToken: verificationToken
      }
    }

    return createdResponse(res, userData, 'Registration successful! Check your email to verify your account.');

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return validationErrorResponse(res, errors);
    }
    if (err.code === 11000) {
      return conflictResponse(res, 'Email already registered', [
        { field: 'email', message: 'Email already registered' }
      ]);
    }

    return errorResponse(res, 'Registration failed: ' + err.message);
  }
};

exports.login = async (req, res) => {
  try {
    console.log('Login attempt for email:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Validation failed - missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password is required' }
        ]
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        errors: [{
          field: 'email',
          message: 'Invalid email or password'
        }]
      });
    }

    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        errors: [{
          field: 'password',
          message: 'Invalid email or password'
        }]
      });
    }

    if (!user.isEmailVerified) {
      console.log('Email not verified for user:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Authentication failed',
        errors: [{
          field: 'email',
          message: 'Please verify your email first'
        }]
      });
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    console.log('Successful login for user:', user.email);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          role: user.role,
          id: user._id,
        }
      }
    });

  } catch (err) {
    console.error('Login error:', {
      message: err.message,
      stack: err.stack,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      message: 'Login failed',
      errors: [{
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }]
    });
  }
};

exports.logout = (req, res) => {
  try {
    res.clearCookie('jwt', 'loggedout', {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    return errorResponse(res, 'Logout failed: ' + err.message);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return validationErrorResponse(res, [
        { field: 'email', message: 'Email is required' }
      ]);
    }

    const user = await User.findOne({ email });

    if (user) {
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      console.log('Password Reset Token:', {
        plainToken: resetToken,
        hashedToken: user.resetPasswordToken,
        expiresAt: new Date(user.resetPasswordExpire)
      });

      await sendPasswordResetEmail(
        user.email,
        user.firstName || 'User',
        resetToken
      );
    }

    return successResponse(res, null, "If email exists, reset link has been sent");
  } catch (err) {
    console.error('Forgot password error:', err);
    return errorResponse(res, "Password reset request failed");
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('Reset Password Request:', {
      method: req.method,
      params: req.params,
      body: req.body,
      headers: req.headers
    });

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password +resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return badRequestResponse(res, "Invalid or expired token");
    }


    if (req.method === 'GET') {
    return successResponse(res, { 
      email: user.email,
      isValid: true 
    }, "Password updated successfully. ");
    }

    const { password } = req.body;
    if (!password) {
      return validationErrorResponse(res, [
        { field: 'password', message: 'Password is required' }
      ]);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    return successResponse(res, null, "Password updated successfully");
  } catch (err) {
    console.error('Reset password error:', err);
    return errorResponse(res, "Password reset failed");
  }
};


exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return validationErrorResponse(res, [
        { field: 'currentPassword', message: 'Current password is required' },
        { field: 'newPassword', message: 'New password is required' }
      ]);
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.verifyPassword(currentPassword))) {
      return unauthorizedResponse(res, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    const authToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    return successResponse(res, { token: authToken }, "Password updated successfully");
  } catch (err) {
    console.error('Password update error:', err);
    return errorResponse(res, "Password update failed");
  }
};