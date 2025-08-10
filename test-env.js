require('dotenv').config();

console.log('Environment Variables Check:');
console.log('============================');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'EXISTS' : 'MISSING');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'EXISTS' : 'MISSING');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'EXISTS' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (!process.env.SENDGRID_API_KEY) {
  console.log('\n❌ SENDGRID_API_KEY is missing!');
  console.log('Please set this in your .env file');
}

if (!process.env.CLIENT_URL) {
  console.log('\n❌ CLIENT_URL is missing!');
  console.log('Please set this in your .env file (e.g., http://localhost:3000)');
}

if (!process.env.JWT_SECRET) {
  console.log('\n❌ JWT_SECRET is missing!');
  console.log('Please set this in your .env file');
}

if (!process.env.MONGODB_URI) {
  console.log('\n❌ MONGODB_URI is missing!');
  console.log('Please set this in your .env file');
}

console.log('\n✅ Environment check complete!');