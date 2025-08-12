const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const {
  generateAuthToken,
  setAuthCookie,
  generateVerificationToken
} = require('../utils/tokenUtils');
// const sendVerificationEmail = require('../utils/emailSender');
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


// exports.signup = async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, passwordConfirm, phone, address } = req.body;

//     // 1) Validate password confirmation
//     if (password !== passwordConfirm) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: [{
//           field: 'passwordConfirm',
//           message: 'Passwords do not match'
//         }]
//       });
//     }

//     // 2) Check for existing user
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: 'Registration failed',
//         errors: [{
//           field: 'email',
//           message: 'Email already registered'
//         }]
//       });
//     }

//     // 3) Create and save user
//     const newUser = await User.create({
//       firstName,
//       lastName,
//       email,
//       password,
//       phone,
//       address: typeof address === 'string'
//         ? { street: address } // Handle string address
//         : address // Handle object address
//     });

//     // 4) Generate and save verification token
//     const verificationToken = newUser.createEmailVerificationToken();
//     await newUser.save({ validateBeforeSave: false });

//     // 5) Send verification email
//     await sendVerificationEmail(newUser.email, newUser.firstName, verificationToken);
//     console.log(`Verification token: ${verificationToken}`);
//     console.log(`Verification URL: ${process.env.CLIENT_URL}/verify-email/${verificationToken}`);


//     // 6) Format response
//     return res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       data: {
//         id: newUser._id,
//         firstName: newUser.firstName,
//         lastName: newUser.lastName,
//         email: newUser.email,
//         phone: newUser.phone,

//       }
//     });

//   } catch (err) {
//     // Handle validation errors
//     // if (err.name === 'ValidationError') {
//     //   const errors = Object.values(err.errors).map(e => ({
//     //     field: e.path,
//     //     message: e.message
//     //   }));

//     //   return res.status(400).json({
//     //     success: false,
//     //     message: 'Validation failed',
//     //     errors
//     //   });
//     // }

//     // Handle all other errors
//     return res.status(500).json({
//       success: false,
//       message: 'Registration failed',
//       errors: [{ message: err.message }],
//       stack: err.stack
//     });
//   }
// };

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordConfirm, phone, address } = req.body;
    console.log('Request Body:', req.body);
    console.log('Headers:', req.headers);

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
    await newUser.save({ validateBeforeSave: false });

    console.log('=== REGISTRATION DEBUG ===');
    console.log('Plain verification token:', verificationToken);
    console.log('Hashed token in DB:', newUser.emailVerificationToken);
    console.log('Token expires at:', newUser.emailVerificationExpire);
    console.log('Current time:', new Date());

    console.log('Sending verification email to:', newUser.email);
    await sendEmail(newUser.email, newUser.firstName, verificationToken);

    // 5) Generate JWT token for login
    const jwtToken = generateToken({ id: newUser._id });

    // 6) Format response
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
        token: jwtToken,  // JWT token for login
        expiresIn: process.env.JWT_EXPIRES_IN,
        verificationToken: verificationToken
      }
    }

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
    const tokenFromUrl = req.params.token;
    console.log('=== VERIFICATION DEBUG ===');
    console.log('Plain token from URL:', tokenFromUrl);

    // Hash the token from URL to match what's in DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(tokenFromUrl)
      .digest('hex');

    console.log('Hashed token for comparison:', hashedToken);

    // Find user with hashed token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User email:', user.email);
      console.log('Stored hashed token in DB:', user.emailVerificationToken);
      console.log('Token expires at:', user.emailVerificationExpire);
      console.log('Current time:', new Date());
    }

    if (!user) {
      return badRequestResponse(res, 'Verification token is invalid or expired');
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    console.log('User verified successfully:', user.email);
    return successResponse(res, null, 'Email verified successfully');

  } catch (err) {
    console.error('Verification error:', err);
    return errorResponse(res, 'Verification failed: ' + err.message);
  }
};

// exports.verifyEmail = async (req, res) => {
//   try {
//     // 1) Hash token from URL
//     const hashedToken = crypto
//       .createHash('sha256')
//       .update(req.params.token)
//       .digest('hex');

//     // 2) Find user with valid token
//     const user = await User.findOne({
//       emailVerificationToken: hashedToken,
//       emailVerificationExpire: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.redirect(`${process.env.CLIENT_URL}/verification-failed`);
//     }

//     // 3) Mark as verified
//     user.isEmailVerified = true;
//     user.emailVerificationToken = undefined;
//     user.emailVerificationExpire = undefined;
//     await user.save();

//     // 4) Redirect to success page
//     return res.redirect(`${process.env.CLIENT_URL}/verification-success`);

//   } catch (err) {
//     return res.redirect(`${process.env.CLIENT_URL}/verification-error`);
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     console.log('Login attempt for email:', req.body.email);

//     const { email, password } = req.body;

//     // 1) Validate input
//     if (!email || !password) {
//       console.log('Validation failed - missing email or password');
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
//       console.log('User not found for email:', email);
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
//       console.log('Invalid password for user:', user.email);
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
//       console.log('Email not verified for user:', user.email);
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
//     const token = generateToken({
//       id: user._id,
//       email: user.email,
//       role: user.role
//     });

//     // 6) Update last login
//     user.lastLogin = Date.now();
//     await user.save({ validateBeforeSave: false });

//     // 7) Format response
//     console.log('Successful login for user:', user.email);
//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         token,
//         user: {
//           fullName: `${user.firstName} ${user.lastName}`,
//           email: user.email,
//           phone: user.phone,
//           role: user.role,
//           id: user._id,
//         }
//       }
//     });

//   } catch (err) {
//     console.error('Login error:', {
//       message: err.message,
//       stack: err.stack,
//       body: req.body
//     });

//     return res.status(500).json({
//       success: false,
//       message: 'Login failed',
//       errors: [{
//         message: err.message,
//         ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//       }]
//     });
//   }
// };

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

    // 1) Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user doesn't exist (security best practice)
      return successResponse(res, null, "If the email exists, a reset link will be sent");
    }

    // 2) Generate reset token (expires in 10 mins)
    // const resetToken = user.createPasswordResetToken();
    // await user.save({ validateBeforeSave: false });

    const { token: resetToken, hashedToken } = generateVerificationToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // 3) Send email
    try {
      await sendEmail({
        type: 'passwordReset',
        email: user.email,
        firstName: user.firstName,
        resetToken
      });
    } catch (emailErr) {
      // Clear token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw emailErr;
    }

    return successResponse(res, null, "Password reset token sent to email");
  } catch (err) {
    return errorResponse(res, 'Failed to send password reset email: ' + err.message + err.stack);
  //     errorResponse(res, "Failed to process password reset request");
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1) Hash token and find user
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return badRequestResponse(res, "Token invalid or expired");
    }

    // 2) Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Send confirmation email (optional)
    await sendEmail({
      type: 'passwordChanged',
      email: user.email,
      firstName: user.firstName
    });

    // 4) Return new token or login response
    const authToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    setTokenCookie(res, authToken);

    return successResponse(res, { token: authToken }, "Password updated successfully");
  } catch (err) {
    return errorResponse(res, "Password reset failed");
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // 1) Verify current password
    if (!(await user.verifyPassword(currentPassword))) {
      return unauthorizedResponse(res, "Current password is incorrect");
    }

    // 2) Update password
    user.password = newPassword;
    await user.save();

    // 3) Return new token
    const authToken = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    return successResponse(res, { token: authToken }, "Password updated successfully");
  } catch (err) {
    return errorResponse(res, "Password update failed");
  }
};