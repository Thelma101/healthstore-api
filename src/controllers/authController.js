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
const { generateToken, setTokenCookie } = require('../utils/tokenUtils');

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
      phone,
      address: typeof address === 'string'
        ? { street: address } // Handle string address
        : address // Handle object address
    });

    // 4) Generate and save verification token
    const verificationToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    // 5) Send verification email
    await sendVerificationEmail(newUser.email, newUser.firstName, verificationToken);
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
    console.log('Login attempt for email:', req.body.email);

    const { email, password } = req.body;

    // 1) Validate input
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

    // 2) Check if user exists
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

    // 3) Verify password
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

    // 4) Check if email is verified
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

    // 5) Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // 6) Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 7) Format response
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

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 1) Validate input
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: [
//           { field: 'email', message: 'Email is required' },
//           { field: 'password', message: 'Password is required' }
//         ]
//       });
//     }

//     // 2) Check if user exists
//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication failed',
//         errors: [{ 
//           field: 'email', 
//           message: 'Invalid email or password' 
//         }]
//       });
//     }

//     // 3) Verify password
//     const isPasswordValid = await user.verifyPassword(password);
//     if (!isPasswordValid) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication failed',
//         errors: [{ 
//           field: 'password', 
//           message: 'Invalid email or password' 
//         }]
//       });
//     }

//     // 4) Check if email is verified
//     if (!user.isEmailVerified) {
//       return res.status(403).json({
//         success: false,
//         message: 'Authentication failed',
//         errors: [{ 
//           field: 'email', 
//           message: 'Please verify your email first' 
//         }]
//       });
//     }

//     // 5) Generate token
//     const token = user.generateAuthToken();

//     // 6) Update last login
//     user.lastLogin = Date.now();
//     await user.save({ validateBeforeSave: false });

//     // 7) Format response
//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         token,
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           email: user.email,
//           role: user.role
//         }
//       }
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: 'Login failed',
//       errors: [{ message: err.message }]
//     });
//   }
// };

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