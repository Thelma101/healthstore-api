const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
require('dotenv').config();

const sendEmail = async (email, firstName, verificationToken) => {
    const msg = {
        to: email,
        from: {
            email: 'akpata.thelma@gmail.com',
            name: 'Tee\'s Health Store'
        },
        subject: 'Verify Your Email Address',
        text: `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Tee's Health Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d3748; margin: 0; font-size: 24px;">Tee's Health Store</h1>
        </div>
        
        <div style="background-color: #f7fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin-top: 0;">Welcome, ${firstName}!</h2>
            
            <p style="color: #4a5568; line-height: 1.6; margin-bottom: 25px;">
                Thank you for registering with Tee's Health Store. To complete your registration, 
                please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; padding: 14px 28px; background-color: #4299e1; 
                          color: white; text-decoration: none; border-radius: 6px; font-weight: bold;
                          font-size: 16px; box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);">
                    Verify Your Email
                </a>
            </div>
            
            <p style="color: #718096; font-size: 14px; margin-bottom: 0;">
                If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #4299e1; font-size: 14px; word-break: break-all; margin-top: 10px;">
                ${verificationUrl}
            </p>
        </div>
        
        <div style="text-align: center; color: #718096; font-size: 14px;">
            <p style="margin-bottom: 10px;">
                If you didn't create this account, you can safely ignore this email.
            </p>
            <p style="margin-bottom: 0;">
                Warm regards,<br>
                <strong>The Tee's Health Store Team</strong>
            </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                This email was sent to ${email} because you registered for an account at Tee's Health Store.
            </p>
        </div>
    </div>
</body>
</html>
    `,
        // Add headers to reduce spam
        headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'high'
        }
    };


    // Debugging logs
    console.log('Attempting to send to:', email);
    console.log('Using API key:', process.env.SENDGRID_API_KEY ? 'Exists' : 'MISSING');
    console.log('Verification URL:', verificationUrl);
    console.log('First Name:', firstName);

    try {
        const result = await sgMail.send(msg);
        console.log('SendGrid response:', result[0].headers);
        return true;
    } catch (error) {
        console.error('SendGrid error:', {
            status: error.response?.statusCode,
            body: error.response?.body,
            headers: error.response?.headers,
            message: error.message,
            stack: error.stack
        });
        throw new Error('Failed to send verification email');
    }

    // const sendEmail = async (email, firstName, token) => {
    //     const msg = {
    //         to: email,
    //         from: {
    //             email: 'akpata.thelma@gmail.com',
    //             name: "Tee's Health Store"
    //         },
    //         subject: `Welcome to Tee's Health Store, ${firstName}! Verify Your Email`,
    //         text: `
    //     Hi ${firstName},

    //     Thank you for registering with Tee's Health Store! 
    //     Please verify your email address to complete your registration.

    //     // Verification Link: ${process.env.CLIENT_URL}/verify-email/${token}

    //     If you didn't request this, please ignore this email.

    //     Warm regards,
    //     The Tee's Health Store Team
    //     `,
    //     html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //         <h2 style="color: #2d3748;">Welcome to Tee's Health Store, ${firstName}!</h2>

    //         <p>Thank you for registering with us. Please verify your email address to complete your registration:</p>

    //         <a href="${process.env.CLIENT_URL}/verify-email/${token}" 
    //            style="display: inline-block; padding: 12px 24px; background-color: #4299e1; 
    //                   color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
    //             Verify Your Email
    //         </a>

    //         <p style="margin-top: 20px; color: #718096;">
    //             If you didn't create this account, you can safely ignore this email.
    //         </p>

    //         <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    //             <p>Warm regards,</p>
    //             <p><strong>The Tee's Health Store Team</strong></p>
    //         </div>
    //     </div>
    //     `
    // };

    // console.log('Attempting to send to:', email); // Debug 1
    // console.log('Using API key:', process.env.SENDGRID_API_KEY ? 'Exists' : 'MISSING'); // Debug 2
    //   console.log('Verification URL:', verificationUrl);
    //   console.log('First Name:', firstName);

    // try {
    //     const result = await sgMail.send(msg);
    //     console.log('SendGrid response:', result[0].headers); // Debug 3
    //     return true;
    // } catch (error) {
    //     console.error('FULL SendGrid error:', {
    //         status: error.response?.statusCode,
    //         body: error.response?.body,
    //         headers: error.response?.headers,
    //         message: error.message,
    //         stack: error.stack
    //     });
    //     throw error;
    // }

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