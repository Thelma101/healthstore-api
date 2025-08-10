require('dotenv').config();
const { sendEmail } = require('./src/utils/emailSender');

async function testEmail() {
  try {
    console.log('Testing email functionality...');
    console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('CLIENT_URL:', process.env.CLIENT_URL);
    
    const result = await sendEmail(
      'test@example.com',
      'Test User',
      'test-token-12345'
    );
    
    console.log('Email test successful:', result);
  } catch (error) {
    console.error('Email test failed:', error.message);
  }
}

testEmail();