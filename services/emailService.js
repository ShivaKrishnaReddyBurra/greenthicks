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
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your GreenThicks Account',
    text: `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to GreenThicks!</h2>
        <p>Thank you for signing up. Please use the OTP below to verify your email address:</p>
        <h3 style="background: #f0f0f0; padding: 10px; display: inline-block; border-radius: 5px;">${otp}</h3>
        <p>This OTP is valid for 10 minutes. If you didn’t request this, please ignore this email.</p>
        <p>Best regards,<br>GreenThicks Team</p>
        <p style="font-size: 12px; color: #666;">
          <a href="https://greenthicks.com">Visit our website</a> | 
          <a href="mailto:support@greenthicks.com">Contact Support</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to GreenThicks!',
    text: 'Thank you for signing up with GreenThicks! We are excited to have you on board.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to GreenThicks!</h2>
        <p>We’re thrilled to have you as part of our community. Start exploring our products and enjoy a seamless shopping experience!</p>
        <p><a href="https://greenthicks.com" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Shop Now</a></p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>GreenThicks Team</p>
        <p style="font-size: 12px; color: #666;">
          <a href="https://greenthicks.com">Visit our website</a> | 
          <a href="mailto:support@greenthicks.com">Contact Support</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendOrderPlacedEmail = async (email, order) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Order Placed: #${order.id}`,
    text: `A new order (#${order.id}) has been placed. Please review and assign a delivery boy.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Order Notification</h2>
        <p>A new order has been placed with the following details:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p>Please assign a delivery boy to this order.</p>
        <p><a href="https://greenthicks.com/admin/orders" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
        <p>Best regards,<br>GreenThicks Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendDeliveryStatusEmail = async (email, order, status) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Delivery Status Update`,
    text: `Your order (#${order.id}) is now ${status.replace('-', ' ')}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Delivery Status Update</h2>
        <p>Your order (#${order.id}) has been updated to: <strong>${status.replace('-', ' ').toUpperCase()}</strong></p>
        <p><strong>Order Details:</strong></p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Delivery Address:</strong> ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
        <p><a href="https://greenthicks.com/orders/${order.globalId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Order</a></p>
        <p>Best regards,<br>GreenThicks Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendWelcomeEmail, sendOrderPlacedEmail, sendDeliveryStatusEmail };