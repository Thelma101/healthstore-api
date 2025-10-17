require('dotenv').config({ path: '../.env' }); 
const mongoose = require('mongoose');
const User = require('../models/userModel'); 
const bcrypt = require('bcryptjs');

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthstore',  {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000
    });    
    console.log('DB connected successfully');

    // Admin Mock 
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
        firstName: 'Pharmacist',
        lastName: 'Admin',
        email: 'admin@ths.com',
                phone: '07025345678',
        password: await bcrypt.hash('Admin123!', 12),
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      }
    ];

    await User.deleteMany({ 
      email: { $in: accounts.map(a => a.email) } 
    });

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