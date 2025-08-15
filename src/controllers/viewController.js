const { resetPasswordFormTemplate } = require('../templates/formTemplate');

exports.getResetPasswordPage = (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token is required');
    
    res.send(resetPasswordFormTemplate(token));
};