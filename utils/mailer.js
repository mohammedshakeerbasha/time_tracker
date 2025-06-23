const nodemailer = require('nodemailer');

// Replace these values with actual SMTP credentials or environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your.email@example.com',
        pass: 'your-app-password'
    }
});

function sendMail(to, subject, text) {
    return transporter.sendMail({
        from: '"Tracket App" <your.email@example.com>',
        to,
        subject,
        text
    });
}

module.exports = sendMail;
