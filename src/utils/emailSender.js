const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, token) => {
    const msg = {
        to: email,
        from: 'akpata.thelma@gmail.com', // Use a verified sender
        subject: 'Verify Your Email',
        text: `Your verification token: ${token}`,
        html: `<strong>Verify here: <a href="http://yourapp.com/verify?token=${token}">Click</a></strong>`,
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent via SendGrid API');
    } catch (error) {
        console.error('SendGrid Error:', error.response?.body || error.message);
        throw new Error('Failed to send email');
    }
};


module.exports = {
    sendVerificationEmail
};