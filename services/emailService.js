const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 5,
  socketTimeout: 5000,
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"GreenThickss Team" <${process.env.EMAIL_USER}>`, // Sender name for trust
    to: email,
    subject: 'Verify Your GreenThickss Account',
    text: `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to GreenThickss!</h2>
        <p>Thank you for signing up. Please use the OTP below to verify your email address:</p>
        <h3 style="background: #f0f0f0; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h3>
        <p>This OTP is valid for 10 minutes. If you didn’t request this, please ignore this email.</p>
        <p>Best regards,<br>GreenThickss Team</p>
        <p style="font-size: 12px; color: #666;">
          <a href="https://greenthickss.com">Visit our website</a> | 
          <a href="mailto:support@greenthickss.com">Contact Support</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email) => {
  const mailOptions = {
    from: `"GreenThickss Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to GreenThickss!',
    text: 'Thank you for signing up with GreenThickss! We are excited to have you on board.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to GreenThickss!</h2>
        <p>We’re thrilled to have you as part of our community. Start exploring our products and enjoy a seamless shopping experience!</p>
        <p><a href="https://greenthickss.com" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Shop Now</a></p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>GreenThickss Team</p>
        <p style="font-size: 12px; color: #666;">
          <a href="https://greenthickss.com">Visit our website</a> | 
          <a href="mailto:support@greenthickss.com">Contact Support</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendWelcomeEmail };