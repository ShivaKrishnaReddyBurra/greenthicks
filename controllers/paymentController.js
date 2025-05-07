const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = [
  body('orderId').isInt({ min: 1 }).withMessage('Invalid order ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { orderId } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ globalId: orderId, userId }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.paymentStatus === 'completed') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Payment already completed' });
      }

      const options = {
        amount: Math.round(order.total * 100), // Amount in paise
        currency: 'INR',
        receipt: `order_${order.globalId}`,
        notes: {
          userId: userId.toString(),
          orderId: order.globalId.toString(),
        },
      };

      const razorpayOrder = await razorpay.orders.create(options);
      order.razorpayOrderId = razorpayOrder.id;
      await order.save({ session });

      await session.commitTransaction();
      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('Create payment order error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const verifyPayment = [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, userId }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      // Verify signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Invalid payment signature' });
      }

      order.paymentStatus = 'completed';
      order.razorpayPaymentId = razorpay_payment_id;
      order.updatedAt = new Date();
      await order.save({ session });

      await session.commitTransaction();
      res.json({ message: 'Payment verified successfully', order });
    } catch (error) {
      await session.abortTransaction();
      console.error('Verify payment error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

module.exports = { createPaymentOrder, verifyPayment };