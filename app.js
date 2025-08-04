const express = require('express');
const cors = require('cors');
const app = express();
// const path = require('path');
// const { 
//   helmetConfig, 
//   cors, 
//   corsErrorHandler, 
//   requestSizeLimit, 
//   securityHeaders 
// } = require('./src/middleware/security');

// Route imports
// const authRoutes = require('./src/routes/authRoute');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

// const drugRoutes = require('./src/routes/drugRoutes');
// const categoryRoutes = require('./src/routes/categoryRoutes');
// const cartRoutes = require('./src/routes/cartRoutes');
// const orderRoutes = require('./src/routes/orderRoutes');

app.use(cors());
app.use(express.json()); // ⬅️ This parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // Optional for form-encoded
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  console.log('Body:', req.body);
  next();
});


// Basic CORS configuration
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));


// Trust proxy for rate limiting behind reverse proxy
// app.set('trust proxy', 1);

// Security middleware
// app.use(helmetConfig);
// app.use(cors());
// app.use(corsErrorHandler);
// app.use(securityHeaders);
// app.use(requestSizeLimit);

// Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/drugs', drugRoutes);
// app.use('/api/v1/categories', categoryRoutes);
// app.use('/api/v1/cart', cartRoutes);
// app.use('/api/v1/orders', orderRoutes);



// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Handle 404 - Route not found
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`,
//     timestamp: new Date().toISOString()
//   });
// });

// app.get('/ping', (req, res) => {
//   res.send('pong');
// });


// API documentation endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    message: 'Pharmacy Store API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      drugs: '/api/v1/drugs',
      categories: '/api/v1/categories',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders'
    },
    documentation: '/api/v1/docs'
  });
});

// Global error handler
// app.use((error, req, res, next) => {
//   console.error('Error:', error);

//   // Mongoose validation error
//   if (error.name === 'ValidationError') {
//     const errors = Object.values(error.errors).map(err => ({
//       field: err.path,
//       message: err.message
//     }));
//     return res.status(400).json({
//       success: false,
//       message: 'Validation error',
//       errors,
//       timestamp: new Date().toISOString()
//     });
//   }

//   // Mongoose cast error (invalid ObjectId)
//   if (error.name === 'CastError') {
//     return res.status(400).json({
//       success: false,
//       message: 'Invalid ID format',
//       timestamp: new Date().toISOString()
//     });
//   }

//   // Duplicate key error
//   if (error.code === 11000) {
//     const field = Object.keys(error.keyPattern)[0];
//     return res.status(409).json({
//       success: false,
//       message: `${field} already exists`,
//       timestamp: new Date().toISOString()
//     });
//   }

//   // JWT errors
//   if (error.name === 'JsonWebTokenError') {
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid token',
//       timestamp: new Date().toISOString()
//     });
//   }

//   if (error.name === 'TokenExpiredError') {
//     return res.status(401).json({
//       success: false,
//       message: 'Token expired',
//       timestamp: new Date().toISOString()
//     });
//   }

//   // Default error
//   const statusCode = error.statusCode || 500;
//   const message = error.message || 'Internal server error';

//   res.status(statusCode).json({
//     success: false,
//     message,
//     ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
//     timestamp: new Date().toISOString()
//   });
// });

module.exports = app;