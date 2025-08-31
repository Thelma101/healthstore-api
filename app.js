
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./src/routes/mainRoute');
const { errorHandler } = require('./src//middleware/errorMiddleware');

const app = express();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false, 
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(cookieParser());

// Apply rate limiter to all routes
app.use(generalLimiter);

// Body parsers
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/', routes);

// Error handling
app.use(errorHandler);

module.exports = app;