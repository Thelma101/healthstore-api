const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbconn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${dbconn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.log('Please make sure MongoDB is running or check your connection string');
    // Don't exit the process, let the app continue without DB
  }
};

// Handle database connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;