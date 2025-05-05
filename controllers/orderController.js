const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Counter = require('../models/Counter');

const createOrder = [
  // Validate request body
  body('paymentMethod').isIn(['credit-card', 'upi', 'cash-on-delivery']).withMessage('Invalid payment method'),
  body('shippingAddress.firstName').notEmpty().trim().withMessage('First name is required'),
  body('shippingAddress.lastName').notEmpty().trim().withMessage('Last name is required'),
  body('shippingAddress.address').notEmpty().trim().withMessage('Address is required'),
  body('shippingAddress.city').notEmpty().trim().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().trim().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().trim().withMessage('ZIP code is required'),
  body('couponCode').optional().trim(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { paymentMethod, shippingAddress, couponCode } = req.body;
    const userId = req.user.id; // From authenticate middleware

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Fetch user
      const user = await User.findOne({ globalId: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      // Fetch cart
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Validate products and stock
      const productIds = cart.items.map(item => item.productId);
      const products = await Product.find({ globalId: { $in: productIds } }).session(session);
      if (products.length !== productIds.length) {
        await session.abortTransaction();
        const missingIds = productIds.filter(id => !products.some(p => p.globalId === id));
        return res.status(400).json({ message: `Products not found: ${missingIds.join(', ')}` });
      }

      // Prepare order items and check stock
      let subtotal = 0;
      const orderItems = cart.items.map(item => {
        const product = products.find(p => p.globalId === item.productId);
        if (!product) throw new Error(`Product with ID ${item.productId} not found`);
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
        subtotal += product.price * item.quantity;
        return {
          productId: product.globalId,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.images[0] || '',
        };
      });

      // Calculate shipping and discount
      const shipping = subtotal > 50 ? 0 : 5.99;
      let discount = 0;
      if (couponCode) {
        if (couponCode.toLowerCase() === 'fresh20') {
          discount = subtotal * 0.2;
        } else if (couponCode.toLowerCase() === 'freeship') {
          discount = shipping;
        } else {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Invalid coupon code' });
        }
      }
      const total = subtotal + shipping - discount;

      // Initialize Counter if needed
      await Counter.findOneAndUpdate(
        { name: 'orderId' },
        { $setOnInsert: { sequence: 0 } },
        { upsert: true, new: true, session }
      );

      // Create order using static method
      const orderData = {
        userId,
        items: orderItems,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: couponCode || '',
        paymentMethod,
        shippingAddress,
        paymentStatus: paymentMethod === 'cash-on-delivery' ? 'pending' : 'completed',
        orderDate: new Date()
      };

      const order = await Order.createNewOrder(orderData, session);
      await order.save({ session });

      // Update product stock
      const stockUpdates = cart.items.map(item => ({
        updateOne: {
          filter: { globalId: item.productId },
          update: { $inc: { stock: -item.quantity } },
        },
      }));
      await Product.bulkWrite(stockUpdates, { session });

      // Update user stats
      user.totalOrders += 1;
      user.totalSpent += total;
      await user.save({ session });

      // Clear the cart
      cart.items = [];
      await cart.save({ session });

      await session.commitTransaction();
      res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
      await session.abortTransaction();
      console.error('Create order error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get user orders error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.globalId);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ globalId: orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to view this order' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateOrderStatus = [
  body('status').isIn(['processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ globalId: parseInt(req.params.globalId) }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      // If cancelling, restore stock
      if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
        const stockUpdates = order.items.map(item => ({
          updateOne: {
            filter: { globalId: item.productId },
            update: { $inc: { stock: item.quantity } },
          },
        }));
        await Product.bulkWrite(stockUpdates, { session });
      }

      order.status = req.body.status;
      order.updatedAt = new Date();
      await order.save({ session });

      await session.commitTransaction();
      res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
      await session.abortTransaction();
      console.error('Update order status error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

module.exports = { createOrder, getUserOrders, getOrder, getAllOrders, updateOrderStatus };