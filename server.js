require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5001;

// Connect to database
connectDB();


const server =  app.listen(PORT, () => {
  console.log(`
🚀 Pharmacy Store API Server
🔗 Running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Health check: http://localhost:${PORT}/health
📚 API endpoints: http://localhost:${PORT}/api/v1
  `);
});

module.exports = server;

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//   console.error('Unhandled Promise Rejection:', err.message);
//   // Close server & exit process
//   server.close(() => {
//     process.exit(1);
//   });
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err.message);
//   console.error(err.stack);
//   process.exit(1);
// });

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received. Shutting down gracefully...');
//   server.close(() => {
//     console.log('Server closed.');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT received. Shutting down gracefully...');
//   server.close(() => {
//     console.log('Server closed.');
//     process.exit(0);
//   });
// });