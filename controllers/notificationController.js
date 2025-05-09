const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { sendOrderPlacedEmail, sendDeliveryStatusEmail } = require('../services/emailService');

const createNotification = async (recipientId, order, type, subject, message, session) => {
  const notification = new Notification({
    recipientId,
    type,
    subject,
    message,
    orderId: order.globalId,
  });

  try {
    if (type === 'email') {
      const user = await mongoose.model('User').findOne({ globalId: recipientId }).session(session);
      if (!user) throw new Error(`User with globalId ${recipientId} not found`);
      const email = user.email || order.shippingAddress.email;

      // Determine which email to send based on the subject
      if (subject.includes('Has Been Placed') || subject.includes('New Order')) {
        await sendOrderPlacedEmail(email, order);
      } else if (subject.includes('Delivery Status')) {
        const status = message.match(/is now (.*?)\./)?.[1].replace(' ', '-') || order.deliveryStatus;
        await sendDeliveryStatusEmail(email, order, status);
      } else {
        throw new Error('Unknown notification type');
      }
      notification.status = 'sent';
    }
    await notification.save({ session });
  } catch (error) {
    notification.status = 'failed';
    await notification.save({ session });
    console.error(`Failed to send ${type} notification for recipient ${recipientId}:`, error.message);
  }
};

const notifyOnOrderPlaced = async (order, session) => {
  // Notify the user
  await createNotification(
    order.userId,
    order,
    'email',
    `Your Order #${order.id} Has Been Placed`,
    `Thank you for your order (#${order.id}). Total: $${order.total.toFixed(2)}.`,
    session
  );

  // Notify all admins
  const admins = await mongoose.model('User').find({ isAdmin: true }).session(session);
  const adminNotifications = admins.map(admin => ({
    recipientId: admin.globalId,
    type: 'email',
    subject: `New Order #${order.id}`,
    message: `A new order (#${order.id}) has been placed. Total: $${order.total.toFixed(2)}.`,
    orderId: order.globalId,
  }));

  for (const notif of adminNotifications) {
    await createNotification(
      notif.recipientId,
      order,
      notif.type,
      notif.subject,
      notif.message,
      session
    );
  }
};

const notifyOnDeliveryStatus = async (order, status, session) => {
  // Notify user
  await createNotification(
    order.userId,
    order,
    'email',
    `Order #${order.id} Delivery Status`,
    `Your order is now ${status.replace('-', ' ')}.`,
    session
  );

  // Notify all admins
  const admins = await mongoose.model('User').find({ isAdmin: true }).session(session);
  const adminNotifications = admins.map(admin => ({
    recipientId: admin.globalId,
    type: 'email',
    subject: `Order #${order.id} Delivery Status Update`,
    message: `Order #${order.id} is now ${status.replace('-', ' ')}.`,
    orderId: order.globalId,
  }));

  for (const notif of adminNotifications) {
    await createNotification(
      notif.recipientId,
      order,
      notif.type,
      notif.subject,
      notif.message,
      session
    );
  }

  // Notify delivery boy (if assigned)
  if (order.deliveryBoyId) {
    const deliveryBoy = await mongoose.model('User').findOne({ globalId: order.deliveryBoyId }).session(session);
    if (deliveryBoy) {
      await createNotification(
        order.deliveryBoyId,
        order,
        'email',
        `Order #${order.id} Delivery Status`,
        `Order #${order.id} is now ${status.replace('-', ' ')}.`,
        session
      );
    }
  }
};

module.exports = { notifyOnOrderPlaced, notifyOnDeliveryStatus };