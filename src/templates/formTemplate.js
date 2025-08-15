// src/templates/formTemplates.js
const resetPasswordFormTemplate = (token) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        /* Keep all your existing CSS styles */
        body { font-family: 'Segoe UI', sans-serif; }
        /* ... rest of your styles ... */
    </style>
</head>
<body>
    <div class="reset-container">
        <!-- Your existing form HTML -->
        <form id="resetForm">
            <input type="hidden" id="token" value="${token}">
            <!-- Rest of your form elements -->
        </form>
    </div>

    <script>
        // Your existing JavaScript
    </script>
</body>
</html>
`;

module.exports = { resetPasswordFormTemplate };


const resetPasswordTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #333;
        }
        .reset-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            padding: 40px;
            text-align: center;
        }
        .logo {
            color: #4f46e5;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        h1 {
            font-size: 22px;
            margin-bottom: 25px;
            color: #111827;
        }
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #374151;
        }
        input[type="password"] {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="password"]:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .submit-btn {
            width: 100%;
            padding: 12px;
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .submit-btn:hover {
            background-color: #4338ca;
        }
        .error-message {
            color: #dc2626;
            margin-top: 5px;
            font-size: 14px;
        }
        .success-message {
            color: #16a34a;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="reset-container">
        <div class="logo">YourApp</div>
        <h1>Reset Your Password</h1>
        
        <div id="errorContainer" class="error-message"></div>
        <div id="successContainer" class="success-message"></div>
        
        <form id="resetForm">
            <input type="hidden" id="token" value="">
            
            <div class="form-group">
                <label for="password">New Password</label>
                <input type="password" id="password" required 
                       placeholder="Enter your new password" minlength="8">
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" required 
                       placeholder="Confirm your new password" minlength="8">
            </div>
            
            <button type="submit" class="submit-btn">Reset Password</button>
        </form>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            document.getElementById('token').value = token;
            
            const form = document.getElementById('resetForm');
            const errorContainer = document.getElementById('errorContainer');
            const successContainer = document.getElementById('successContainer');
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                // Clear previous messages
                errorContainer.textContent = '';
                successContainer.textContent = '';
                
                // Validate passwords match
                if (password !== confirmPassword) {
                    errorContainer.textContent = 'Passwords do not match';
                    return;
                }
                
                // Validate password strength (optional)
                if (password.length < 8) {
                    errorContainer.textContent = 'Password must be at least 8 characters';
                    return;
                }
                
                try {
                    const response = await fetch('/api/v1/auth/reset-password/' + token, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        successContainer.textContent = 'Password reset successfully! Redirecting to login...';
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    } else {
                        errorContainer.textContent = result.message || 'Password reset failed';
                    }
                } catch (error) {
                    errorContainer.textContent = 'An error occurred. Please try again.';
                    console.error('Reset password error:', error);
                }
            });
        });
    </script>
</body>
</html>
`;


const sendPasswordResetEmail = async (email, firstName, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const msg = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Reset Your Password',
        html: `
            <p>Hello ${firstName},</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    };
    
    await sgMail.send(msg);
};