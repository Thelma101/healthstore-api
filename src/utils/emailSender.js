const sgMail = require('@sendgrid/mail');
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendEmail = async (options) => {
  if (typeof options === 'string') {
    options = {
      email: arguments[0],
      subject: 'Verify your email',
      context: {
        name: arguments[1],
        verificationToken: arguments[2],
        verificationUrl: `${process.env.CLIENT_URL}/verify-email/${arguments[2]}`
      }
    };
  }

  const msg = {
    to: options.email,
    from: {
      email: 'akpata.thelma@gmail.com',
      name: "Tee's Health Store"
    },
    templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID,
    dynamicTemplateData: {
      firstName: options.context.name,
      verificationToken: options.context.verificationToken,
      verificationUrl: options.context.verificationUrl
    },
    subject: `Welcome to Tee's Health Store, ${firstName}! Verify Your Email`,
    text: `
Hi ${firstName},

Thank you for registering with Tee's Health Store! 
Please verify your email address to complete your registration.

Verification Link: ${verificationUrl}

If you didn't request this, please ignore this email.

Warm regards,
The Tee's Health Store Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2d3748;">Welcome to Tee's Health Store, ${firstName}!</h2>
  
  <p>Thank you for registering with us. Please verify your email address:</p>
  
  <a href="${verificationUrl}" 
     style="display: inline-block; padding: 12px 24px; background-color: #4299e1; 
            color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
    Verify Your Email
  </a>
  
  <p style="margin-top: 20px; color: #718096;">
    If you didn't create this account, please ignore this email.
  </p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    <p>Warm regards,</p>
    <p><strong>The Tee's Health Store Team</strong></p>
  </div>
</div>
    `
  };

  // Debugging logs
  console.log('Attempting to send to:', email);
  console.log('Using API key:', process.env.SENDGRID_API_KEY ? 'Exists' : 'MISSING');

  try {
    const result = await sgMail.send(msg);
    console.log('SendGrid response:', result[0].headers);
    return true;
  } catch (error) {
    console.error('SendGrid error:', {
      status: error.response?.statusCode,
      message: error.message
    });
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendEmail };