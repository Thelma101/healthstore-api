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
            message: error.message
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
    sendVerificationEmail
};