const sgMail = require('@sendgrid/mail');
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, firstName, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  
  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_VERIFIED_SENDER || 'akpata.thelma@gmail.com',
      name: "Tee's Health Store"
    },
    subject: `Welcome to Tee's Health Store, ${firstName || 'User'}! Verify Your Email`,
    text: `
Hi ${firstName || 'User'},

Thank you for registering with Tee's Health Store! 
Please verify your email address to complete your registration.

Verification Link: ${verificationUrl}

If you didn't request this, please ignore this email.

Warm regards,
The Tee's Health Store Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Tee's Health Store</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background-color: #f7fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
        .button { 
            display: inline-block; padding: 14px 28px; background-color: #4299e1; 
            color: white; text-decoration: none; border-radius: 6px; font-weight: bold;
            font-size: 16px; box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #2d3748; margin: 0; font-size: 24px;">Tee's Health Store</h1>
        </div>
        
        <div class="content">
            <h2 style="color: #2d3748; margin-top: 0;">Welcome, ${firstName || 'User'}!</h2>
            
            <p style="color: #4a5568; line-height: 1.6; margin-bottom: 25px;">
                Thank you for registering with Tee's Health Store. To complete your registration, 
                please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">
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
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', {
      email,
      error: error.message,
      response: error.response?.body
    });
    throw new Error('Failed to send verification email');
  }
};

const sendPasswordResetEmail = async (email, firstName, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
// const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_VERIFIED_SENDER || 'akpata.thelma@gmail.com',
      name: "Tee's Health Store"
    },
    subject: `Password Reset Request - Tee's Health Store`,
    text: `
Hi ${firstName || 'User'},

You requested to reset your password for Tee's Health Store.
Please click the link below to set a new password:

Reset Link: ${resetUrl}

This link will expire in 10 minutes.

If you didn't request this, please ignore this email.

Warm regards,
The Tee's Health Store Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Tee's Health Store</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background-color: #f7fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
        .button { 
            display: inline-block; padding: 14px 28px; background-color: #4299e1; 
            color: white; text-decoration: none; border-radius: 6px; font-weight: bold;
            font-size: 16px; box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #2d3748; margin: 0; font-size: 24px;">Tee's Health Store</h1>
        </div>
        
        <div class="content">
            <h2 style="color: #2d3748; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #4a5568; line-height: 1.6; margin-bottom: 25px;">
                Hi ${firstName || 'User'}, you requested to reset your password. 
                Please click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">
                    Reset Password
                </a>
            </div>
            
            <p style="color: #718096; font-size: 14px; margin-bottom: 0;">
                This link will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <p style="color: #4299e1; font-size: 14px; word-break: break-all; margin-top: 10px;">
                ${resetUrl}
            </p>
        </div>
        
        <div style="text-align: center; color: #718096; font-size: 14px;">
            <p style="margin-bottom: 0;">
                Warm regards,<br>
                <strong>The Tee's Health Store Team</strong>
            </p>
        </div>
    </div>
</body>
</html>
    `,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent to ${email} ${token}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', {
      email,
      error: error.message,
      response: error.response?.body
    });
    throw new Error('Failed to send password reset email');
  }
};

const sendOrderConfirmationEmail = async (email, firstName, orderData) => {
  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_VERIFIED_SENDER || 'akpata.thelma@gmail.com',
      name: "Tee's Health Store"
    },
    subject: `Order Confirmation - #${orderData.orderNumber}`,
    text: `
Hi ${firstName || 'Customer'},

Thank you for your order at Tee's Health Store!

Order Details:
Order Number: ${orderData.orderNumber}
Order Date: ${new Date(orderData.createdAt).toLocaleDateString()}
Total Amount: ₦${orderData.totalAmount.toLocaleString()}

Items Ordered:
${orderData.items.map(item => `- ${item.name} x${item.quantity} - ₦${(item.price * item.quantity).toLocaleString()}`).join('\n')}

Shipping Address:
${orderData.shippingAddress.street}
${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}
${orderData.shippingAddress.country}

Order Status: ${orderData.status.formatted}

We'll notify you when your order is on its way. You can track your order status in your account.

If you have any questions, please contact our support team.

Warm regards,
The Tee's Health Store Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Tee's Health Store</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #4299e1; }
        .order-details { background-color: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px; }
        .item { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
        .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 20px; padding-top: 20px; border-top: 2px solid #4299e1; }
        .status-badge { 
            display: inline-block; padding: 8px 16px; background-color: #4299e1; 
            color: white; border-radius: 20px; font-weight: bold; font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #2d3748; margin: 0; font-size: 28px;">Tee's Health Store</h1>
            <p style="color: #718096; margin: 10px 0 0 0;">Order Confirmation</p>
        </div>
        
        <div style="margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0;">Thank you for your order, ${firstName}!</h2>
            <p style="color: #4a5568; line-height: 1.6;">
                We've received your order and are processing it. Here are your order details:
            </p>
        </div>

        <div class="order-details">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <strong style="color: #2d3748;">Order Number:</strong> ${orderData.orderNumber}
                </div>
                <span class="status-badge">${orderData.status.formatted}</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong style="color: #2d3748; display: block; margin-bottom: 10px;">Order Items:</strong>
                ${orderData.items.map(item => `
                <div class="item">
                    <div>
                        <strong>${item.name}</strong>
                        <div style="color: #718096; font-size: 14px;">Quantity: ${item.quantity}</div>
                    </div>
                    <div style="text-align: right;">
                        <div>₦${item.price.toLocaleString()} each</div>
                        <strong>₦${(item.price * item.quantity).toLocaleString()}</strong>
                    </div>
                </div>
                `).join('')}
            </div>

            <div class="total">
                <span>Total Amount:</span>
                <span>₦${orderData.totalAmount.toLocaleString()}</span>
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <strong style="color: #2d3748; display: block; margin-bottom: 10px;">Shipping Address:</strong>
            <p style="color: #4a5568; margin: 0; line-height: 1.6;">
                ${orderData.shippingAddress.street}<br>
                ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}<br>
                ${orderData.shippingAddress.country}<br>
                ${orderData.shippingAddress.postalCode || ''}
            </p>
        </div>

        <div style="background-color: #e6fffa; padding: 20px; border-radius: 8px; border-left: 4px solid #38b2ac;">
            <strong style="color: #234e52; display: block; margin-bottom: 10px;">What's Next?</strong>
            <p style="color: #234e52; margin: 0; line-height: 1.6;">
                We'll send you another email when your order ships. You can also track your order status 
                by logging into your account on our website.
            </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 0;">
                If you have any questions, please contact our support team at 
                <a href="mailto:support@teeshealthstore.com" style="color: #4299e1;">support@teeshealthstore.com</a>
            </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">
                This email was sent to ${email} in confirmation of your order at Tee's Health Store.
            </p>
        </div>
    </div>
</body>
</html>
    `,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    await sgMail.send(msg);
    console.log(`Order confirmation email sent to ${email} for order ${orderData.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', {
      email,
      orderNumber: orderData.orderNumber,
      error: error.message,
      response: error.response?.body
    });
    throw new Error('Failed to send order confirmation email');
  }
};

const sendOrderStatusUpdateEmail = async (email, firstName, orderData, oldStatus, newStatus) => {
  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_VERIFIED_SENDER || 'akpata.thelma@gmail.com',
      name: "Tee's Health Store"
    },
    subject: `Order Update - #${orderData.orderNumber} is now ${newStatus.formatted}`,
    text: `
Hi ${firstName || 'Customer'},

Your order status has been updated.

Order Number: ${orderData.orderNumber}
Previous Status: ${oldStatus.formatted}
New Status: ${newStatus.formatted}

Order Details:
Total Amount: ₦${orderData.totalAmount.toLocaleString()}
Items: ${orderData.items.map(item => `${item.name} x${item.quantity}`).join(', ')}

You can view your order details and track its progress in your account.

If you have any questions, please contact our support team.

Warm regards,
The Tee's Health Store Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update - Tee's Health Store</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .status-update { background-color: #e6fffa; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #38b2ac; }
        .status-badge { 
            display: inline-block; padding: 8px 16px; background-color: #38b2ac; 
            color: white; border-radius: 20px; font-weight: bold; font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #2d3748; margin: 0; font-size: 24px;">Tee's Health Store</h1>
            <p style="color: #718096; margin: 10px 0 0 0;">Order Status Update</p>
        </div>
        
        <div style="margin-bottom: 25px;">
            <h2 style="color: #2d3748; margin-top: 0;">Order Update, ${firstName}!</h2>
            <p style="color: #4a5568; line-height: 1.6;">
                Your order status has been updated. Here are the details:
            </p>
        </div>

        <div class="status-update">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="status-badge">${newStatus.formatted}</span>
            </div>
            
            <div style="text-align: center;">
                <strong style="color: #234e52;">Order Number:</strong> ${orderData.orderNumber}<br>
                <strong style="color: #234e52;">Previous Status:</strong> ${oldStatus.formatted}<br>
                <strong style="color: #234e52;">New Status:</strong> ${newStatus.formatted}<br>
                <strong style="color: #234e52;">Total Amount:</strong> ₦${orderData.totalAmount.toLocaleString()}
            </div>
        </div>

        <div style="margin-bottom: 25px;">
            <strong style="color: #2d3748; display: block; margin-bottom: 10px;">Order Items:</strong>
            <p style="color: #4a5568; margin: 0;">
                ${orderData.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
            </p>
        </div>

        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px;">
            <strong style="color: #2d3748; display: block; margin-bottom: 10px;">Next Steps:</strong>
            <p style="color: #4a5568; margin: 0; line-height: 1.6;">
                ${newStatus.current === 'approved' ? 'Your order has been approved and is being processed. We will notify you when it ships.' : 
                 newStatus.current === 'completed' ? 'Your order has been delivered successfully. Thank you for shopping with us!' :
                 newStatus.current === 'rejected' ? 'Your order has been rejected. Please contact support for more information.' :
                 'Your order is being processed. We will keep you updated on its progress.'}
            </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 0;">
                You can view your order details in your account dashboard.
            </p>
        </div>
    </div>
</body>
</html>
    `,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    await sgMail.send(msg);
    console.log(`Order status update email sent to ${email} for order ${orderData.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send order status update email:', {
      email,
      orderNumber: orderData.orderNumber,
      error: error.message,
      response: error.response?.body
    });
    throw new Error('Failed to send order status update email');
  }
};

module.exports = { 
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
};;