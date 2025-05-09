const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (phone, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`SMS sent to ${phone}`);
  } catch (error) {
    console.error('SMS error:', error.message);
    throw error;
  }
};

const sendOrderPlacedSMS = async (phone, order) => {
  const message = `New order #${order.id} placed. Total: $${order.total.toFixed(2)}. Please assign a delivery boy.`;
  await sendSMS(phone, message);
};

const sendDeliveryStatusSMS = async (phone, order, status) => {
  const message = `Order #${order.id} is now ${status.replace('-', ' ')}. Total: $${order.total.toFixed(2)}.`;
  await sendSMS(phone, message);
};

module.exports = { sendOrderPlacedSMS, sendDeliveryStatusSMS };