const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { 
  sendUserOrderPlacedEmail, 
  sendAdminOrderPlacedEmail, 
  sendUserDeliveryStatusEmail, 
  sendAdminDeliveryStatusEmail, 
  sendDeliveryBoyDeliveryStatusEmail,
  sendUserOrderCancelledEmail,
  sendAdminOrderCancelledEmail,
  sendDeliveryBoyOrderCancelledEmail 
} = require('../services/emailService');

const createNotification = async (recipientId, order, type, subject, message, session, recipientType) => {
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

      if (subject.includes('Has Been Placed') && recipientType === 'user') {
        await sendUserOrderPlacedEmail(email, order);
      } else if (subject.includes('New Order') && recipientType === 'admin') {
        await sendAdminOrderPlacedEmail(email, order);
      } else if (subject.includes('Delivery Status')) {
        const status = message.match(/is now (.*?)\./)?.[1].replace(' ', '-') || order.deliveryStatus;
        if (recipientType === 'user') {
          await sendUserDeliveryStatusEmail(email, order, status);
        } else if (recipientType === 'admin') {
          await sendAdminDeliveryStatusEmail(email, order, status);
        } else if (recipientType === 'deliveryBoy') {
          await sendDeliveryBoyDeliveryStatusEmail(email, order, status);
        } else {
          throw new Error('Unknown recipient type for delivery status');
        }
      } else if (subject.includes('Cancelled')) {
        if (recipientType === 'user') {
          await sendUserOrderCancelledEmail(email, order);
        } else if (recipientType === 'admin') {
          await sendAdminOrderCancelledEmail(email, order);
        } else if (recipientType === 'deliveryBoy') {
          await sendDeliveryBoyOrderCancelledEmail(email, order);
        } else {
          throw new Error('Unknown recipient type for cancellation');
        }
      } else {
        throw new Error('Unknown notification type or recipient');
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
  await createNotification(
    order.userId,
    order,
    'email',
    `Your Order #${order.id} Has Been Placed`,
    `Thank you for your order (#${order.id}). Total: $${order.total.toFixed(2)}.`,
    session,
    'user'
  );

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
      session,
      'admin'
    );
  }
};

const notifyOnOrderCancelled = async (order, session) => {
  await createNotification(
    order.userId,
    order,
    'email',
    `Your Order #${order.id} Has Been Cancelled`,
    `Your order (#${order.id}) has been cancelled.`,
    session,
    'user'
  );

  const admins = await mongoose.model('User').find({ isAdmin: true }).session(session);
  const adminNotifications = admins.map(admin => ({
    recipientId: admin.globalId,
    type: 'email',
    subject: `Order #${order.id} Cancelled`,
    message: `Order #${order.id} has been cancelled by the user.`,
    orderId: order.globalId,
  }));

  for (const notif of adminNotifications) {
    await createNotification(
      notif.recipientId,
      order,
      notif.type,
      notif.subject,
      notif.message,
      session,
      'admin'
    );
  }

  if (order.deliveryBoyId) {
    const deliveryBoy = await mongoose.model('User').findOne({ globalId: order.deliveryBoyId }).session(session);
    if (deliveryBoy) {
      await createNotification(
        order.deliveryBoyId,
        order,
        'email',
        `Order #${order.id} Cancelled`,
        `Order #${order.id} has been cancelled.`,
        session,
        'deliveryBoy'
      );
    }
  }
};

const notifyOnDeliveryStatus = async (order, status, session) => {
  await createNotification(
    order.userId,
    order,
    'email',
    `Order #${order.id} Delivery Status`,
    `Your order is now ${status.replace('-', ' ')}.`,
    session,
    'user'
  );

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
      session,
      'admin'
    );
  }

  if (order.deliveryBoyId) {
    const deliveryBoy = await mongoose.model('User').findOne({ globalId: order.deliveryBoyId }).session(session);
    if (deliveryBoy) {
      await createNotification(
        order.deliveryBoyId,
        order,
        'email',
        `Order #${order.id} Delivery Status`,
        `Order #${order.id} is now ${status.replace('-', ' ')}.`,
        session,
        'deliveryBoy'
      );
    }
  }
};

module.exports = { notifyOnOrderPlaced, notifyOnOrderCancelled, notifyOnDeliveryStatus };