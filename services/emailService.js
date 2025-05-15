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

const sendUserOrderPlacedEmail = async (email, order) => {
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Order #${order.id} Has Been Placed`,
    text: `Thank you for your order (#${order.id}). Total: $${order.total.toFixed(2)}. View your order details at https://greenthicks.com/orders/${order.globalId}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Thank You for Your Order!</h2>
        <p>Your order (#${order.id}) has been successfully placed. Below are the details:</p>
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Quantity</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        <p style="margin-top: 20px;"><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
        <p><strong>Shipping:</strong> $${order.shipping.toFixed(2)}</p>
        <p><strong>Discount:</strong> $${order.discount.toFixed(2)}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <h3>Shipping Address</h3>
        <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
           ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
           ${order.shippingAddress.email}<br>
           ${order.shippingAddress.phone}</p>
        <p><a href="https://greenthicks.com/orders/${order.globalId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
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

const sendAdminOrderPlacedEmail = async (email, order) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Order #${order.id} Placed`,
    text: `A new order (#${order.id}) has been placed. Total: $${order.total.toFixed(2)}. Please review and assign a delivery boy at https://greenthicks.com/admin/orders.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Order Notification</h2>
        <p>A new order has been placed with the following details:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p>Please assign a delivery boy to this order.</p>
        <p><a href="https://greenthicks.com/admin/orders" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Order</a></p>
        <p>Best regards,<br>GreenThicks Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendUserDeliveryStatusEmail = async (email, order, status) => {
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Delivery Status Update`,
    text: `Your order (#${order.id}) is now ${status.replace('-', ' ')}. Track your order at https://greenthicks.com/orders/${order.globalId}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Delivery Status Update</h2>
        <p>Your order (#${order.id}) has been updated to: <strong>${status.replace('-', ' ').toUpperCase()}</strong></p>
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Quantity</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        <p style="margin-top: 20px;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <h3>Delivery Address</h3>
        <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
           ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
           ${order.shippingAddress.phone}</p>
        <p><a href="https://greenthicks.com/orders/${order.globalId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Order</a></p>
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

const sendAdminDeliveryStatusEmail = async (email, order, status) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Delivery Status Update`,
    text: `Order (#${order.id}) is now ${status.replace('-', ' ')}. Review at https://greenthicks.com/admin/orders.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Delivery Status Update</h2>
        <p>Order (#${order.id}) has been updated to: <strong>${status.replace('-', ' ').toUpperCase()}</strong></p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p>Please review the order details in the admin panel.</p>
        <p><a href="https://greenthicks.com/admin/orders" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Order</a></p>
        <p>Best regards,<br>GreenThicks Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendDeliveryBoyDeliveryStatusEmail = async (email, order, status) => {
  const itemsList = order.items.map(item => `
    <li>${item.name} (Qty: ${item.quantity}, Price: $${item.price.toFixed(2)})</li>
  `).join('');

  const instructions = status === 'assigned' 
    ? 'Please prepare to pick up the order and update the status to "out-for-delivery" once you begin delivery.'
    : status === 'out-for-delivery'
    ? 'Please deliver the order to the customer and update the status to "delivered" upon completion.'
    : 'Thank you for completing the delivery. No further action is required.';

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Delivery Assignment Update`,
    text: `Order (#${order.id}) is now ${status.replace('-', ' ')}. Please follow the instructions at https://greenthicks.com/delivery/orders/${order.globalId}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Delivery Assignment Update</h2>
        <p>Order (#${order.id}) has been updated to: <strong>${status.replace('-', ' ').toUpperCase()}</strong></p>
        <p><strong>Instructions:</strong> ${instructions}</p>
        <h3>Order Details</h3>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsList}</ul>
        <h3>Delivery Address</h3>
        <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
           ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
           ${order.shippingAddress.phone}</p>
        <p><a href="https://greenthicks.com/delivery/orders/${order.globalId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
        <p>Best regards,<br>GreenThicks Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendUserOrderCancelledEmail = async (email, order) => {
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Order #${order.id} Has Been Cancelled`,
    text: `Your order (#${order.id}) has been cancelled. Total: $${order.total.toFixed(2)}. For more details, visit https://greenthicks.com/orders/${order.globalId}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Order Cancellation Confirmation</h2>
        <p>Your order (#${order.id}) has been successfully cancelled. Below are the details:</p>
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Quantity</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        <p style="margin-top: 20px;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p>If you have any questions or need further assistance, please contact our support team.</p>
        <p><a href="https://greenthicks.com/orders/${order.globalId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
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

const sendAdminOrderCancelledEmail = async (email, order) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Cancelled`,
    text: `Order (#${order.id}) has been cancelled by the user. Total: $${order.total.toFixed(2)}. Review at https://greenthicks.com/admin/orders.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Order Cancellation Notification</h2>
        <p>Order (#${order.id}) has been cancelled by the user with the following details:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p>Please review the order details in the admin panel.</p>
        <p><a href="https://greenthicks.com/admin/orders" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Order</a></p>
        <p>Best regards,<br>GreenThicks Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendDeliveryBoyOrderCancelledEmail = async (email, order) => {
  const itemsList = order.items.map(item => `
    <li>${item.name} (Qty: ${item.quantity}, Price: $${item.price.toFixed(2)})</li>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Cancelled`,
    text: `Order (#${order.id}) has been cancelled. No further action is required. View details at https://greenthicks.com/delivery/orders/${order.globalId}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Order Cancellation Notification</h2>
        <p>Order (#${order.id}) has been cancelled by the user. No further action is required.</p>
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsList}</ul>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p><a href="https://greenthicks.com/delivery/orders/${order.globalId}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
        <p>Best regards,<br>GreenThicks Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { 
  sendOTP, 
  sendWelcomeEmail, 
  sendUserOrderPlacedEmail, 
  sendAdminOrderPlacedEmail, 
  sendUserDeliveryStatusEmail, 
  sendAdminDeliveryStatusEmail, 
  sendDeliveryBoyDeliveryStatusEmail,
  sendUserOrderCancelledEmail,
  sendAdminOrderCancelledEmail,
  sendDeliveryBoyOrderCancelledEmail 
};