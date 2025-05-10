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
      <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.5;">Thank you for signing up. Please use the OTP below to verify your email address:</p>
    <div style="text-align: center; margin: 25px 0;">
      <div style="background: #f0f0f0; padding: 15px; display: inline-block; border-radius: 8px; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #28a745; border: 1px dashed #28a745;">${otp}</div>
    </div>
    <p style="color: #555; font-size: 14px; line-height: 1.5; text-align: center;">This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
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
      <h2 style="color: #333; text-align: center;">Welcome to GreenThicks!</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: center;">We're thrilled to have you as part of our community. Start exploring our products and enjoy a seamless shopping experience!</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://greenthicks.live" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">Shop Now</a>
    </div>
    <p style="color: #555; font-size: 14px; line-height: 1.5; text-align: center;">If you have any questions, feel free to reach out to our support team.</p>
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
      <h2 style="color: #333; text-align: center;">New Order Notification</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.5;">A new order has been placed with the following details:</p>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
      <p style="margin: 5px 0;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
      <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
    </div>
    <p style="color: #555; font-size: 16px; line-height: 1.5;">Please assign a delivery boy to this order.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://greenthicks.live/admin/orders" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">View Order</a>
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
      <h2 style="color: #333; text-align: center;">Delivery Status Update</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: center;">Your order (#${order.id}) has been updated to:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="background: ${statusColor}; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block;">${formattedStatus}</span>
    </div>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <p style="margin: 5px 0;"><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
      <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
    </div>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://greenthicks.live/orders/${order.globalId}" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">Track Order</a>
    </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendWelcomeEmail, sendOrderPlacedEmail, sendDeliveryStatusEmail };