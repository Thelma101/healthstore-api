const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, firstName, token) => {
const msg = {
    to: email,
    from: {
        email: 'akpata.thelma@gmail.com',  
        name: "Tee's Health Store"          
    },
    subject: `Welcome to Tee's Health Store, ${firstName}! Verify Your Email`,
    text: `
    Hi ${firstName},

    Thank you for registering with Tee's Health Store! 
    Please verify your email address to complete your registration.

    Verification Link: ${process.env.CLIENT_URL}/verify-email/${token}

    If you didn't request this, please ignore this email.

    Warm regards,
    The Tee's Health Store Team
    `,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Welcome to Tee's Health Store, ${firstName}!</h2>
        
        <p>Thank you for registering with us. Please verify your email address to complete your registration:</p>
        
        <a href="${process.env.CLIENT_URL}/verify-email/${token}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4299e1; 
                  color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Your Email
        </a>
        
        <p style="margin-top: 20px; color: #718096;">
            If you didn't create this account, you can safely ignore this email.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p>Warm regards,</p>
            <p><strong>The Tee's Health Store Team</strong></p>
        </div>
    </div>
    `
};

    console.log('Attempting to send to:', email); // Debug 1
    console.log('Using API key:', process.env.SENDGRID_API_KEY ? 'Exists' : 'MISSING'); // Debug 2

    try {
        const result = await sgMail.send(msg);
        console.log('SendGrid response:', result[0].headers); // Debug 3
        return true;
    } catch (error) {
        console.error('FULL SendGrid error:', {
            status: error.response?.statusCode,
            body: error.response?.body,
            headers: error.response?.headers,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }

    // try {
    //     await sgMail.send(msg);
    //     console.log('Email sent via SendGrid API');
    // } catch (error) {
    //     console.error('SendGrid Error:', error.response?.body || error.message);
    //     throw new Error('Failed to send email');
    // }
};


module.exports = {
    sendEmail
};