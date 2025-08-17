// src/seeders/seedAdmins.js
require('dotenv').config({ path: '../.env' }); // Points to .env in project root
const mongoose = require('mongoose');
const User = require('../models/userModel'); // Path from seeders to models
const bcrypt = require('bcryptjs');

const seedAdmins = async () => {
  try {
    // Connect with modern options
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthstore',  {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000
    });
    
    console.log('✅ DB connected successfully');

    // Admin accounts data
    const accounts = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@ths.com',
        phone: '09025345678',
        password: await bcrypt.hash('Super@dmin123', 12),
        role: 'superadmin',
        isActive: true,
        isEmailVerified: true
      },
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@ths.com',
                phone: '07025345678',
        password: await bcrypt.hash('Admin123!', 12),
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      }
    ];

    // Clear existing test accounts
    await User.deleteMany({ 
      email: { $in: accounts.map(a => a.email) } 
    });

    // Create accounts
    const created = await User.insertMany(accounts);

    console.log('\n🔥 Admin accounts created:');
    created.forEach(user => {
      console.log(`- ${user.role}: ${user.email}`);
    });
    console.log('\n⚠️  IMPORTANT: Change these passwords immediately after first login!\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n Seeding failed:', err.message);
  }
};

seedAdmins();