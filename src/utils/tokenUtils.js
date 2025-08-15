const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// JWT Tokens (Authentication)
const generateAuthToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

const setAuthCookie = (res, token) => {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseInt(process.env.JWT_COOKIE_EXPIRE) || 30 * 24 * 60 * 60 * 10000
  });
};

// Verification Tokens (Email, Password Reset)
const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return { token, hashedToken };
};

const verifyToken = (inputToken, storedHash) => {
  const inputHash = crypto
    .createHash('sha256')
    .update(inputToken)
    .digest('hex');
  return inputHash === storedHash;
};

module.exports = {
  // Authentication
  generateAuthToken,
  setAuthCookie,
  
  // Verification
  generateVerificationToken,
  verifyToken
};