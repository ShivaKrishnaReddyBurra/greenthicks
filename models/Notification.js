const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: Number, required: true }, // References User.globalId
  type: { type: String, required: true, enum: ['email', 'sms'] },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'sent', 'failed'] },
  orderId: { type: Number }, // References Order.globalId
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);