const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Counter = require('../models/Counter');
const Coupon = require('../models/Coupon');
const ServiceArea = require('../models/ServiceArea');
const { notifyOnOrderPlaced, notifyOnOrderCancelled } = require('./notificationController');
const { updateDeliveryStatus } = require('./deliveryController');

const createOrder = [
  body('paymentMethod').isIn(['credit-card', 'upi', 'cash-on-delivery']).withMessage('Invalid payment method'),
  body('addressId').isInt({ min: 1 }).withMessage('Invalid address ID'),
  body('couponCode').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { paymentMethod, addressId, couponCode } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ globalId: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      const address = user.addresses.find(addr => addr.addressId === addressId);
      if (!address) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Address not found' });
      }

      const serviceArea = await ServiceArea.findOne({ pincode: address.zipCode, isActive: true }).session(session);
      if (!serviceArea) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Service not available in this area' });
      }

      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cart is empty' });
      }

      const productIds = cart.items.map(item => item.productId);
      const products = await Product.find({ globalId: { $in: productIds } }).session(session);
      if (products.length !== productIds.length) {
        await session.abortTransaction();
        const missingIds = productIds.filter(id => !products.some(p => p.globalId === id));
        return res.status(400).json({ message: `Products not found: ${missingIds.join(', ')}` });
      }

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

      const shipping = subtotal > 50 ? 0 : 5.99;
      let discount = 0;
      let appliedCoupon = null;
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toLowerCase(), active: true }).session(session);
        if (!coupon || coupon.expiryDate < new Date()) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Invalid or expired coupon code' });
        }
        if (coupon.minimumOrderAmount > subtotal) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Minimum order amount for coupon is ${coupon.minimumOrderAmount}` });
        }
        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Coupon usage limit reached' });
        }
        discount = coupon.discountType === 'percentage'
          ? subtotal * (coupon.discountValue / 100)
          : coupon.discountValue;
        appliedCoupon = coupon;
      }
      const total = subtotal + shipping - discount;

      await Counter.findOneAndUpdate(
        { name: 'orderId' },
        { $setOnInsert: { sequence: 0 } },
        { upsert: true, new: true, session }
      );

      const orderData = {
        userId,
        items: orderItems,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: couponCode || '',
        paymentMethod,
        paymentStatus: paymentMethod === 'cash-on-delivery' ? 'pending' : 'pending',
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          address: address.address,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          email: address.email,
          phone: address.phone,
          location: address.location,
        },
        orderDate: new Date(),
      };

      const order = await Order.createNewOrder(orderData, session);
      await order.save({ session });

      const stockUpdates = cart.items.map(item => ({
        updateOne: {
          filter: { globalId: item.productId },
          update: { $inc: { stock: -item.quantity } },
        },
      }));
      await Product.bulkWrite(stockUpdates, { session });

      user.totalOrders += 1;
      user.totalSpent += total;
      await user.save({ session });

      if (appliedCoupon) {
        appliedCoupon.usedCount += 1;
        await appliedCoupon.save({ session });
      }

      cart.items = [];
      await cart.save({ session });

      await notifyOnOrderPlaced(order, session);

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

const cancelOrder = [
  async (req, res) => {
    const orderId = parseInt(req.params.globalId);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ globalId: orderId }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.userId !== req.user.id) {
        await session.abortTransaction();
        return res.status(403).json({ message: 'Unauthorized to cancel this order' });
      }

      if (order.status === 'cancelled') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Order is already cancelled' });
      }

      if (order.status === 'delivered') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cannot cancel a delivered order' });
      }

      const stockUpdates = order.items.map(item => ({
        updateOne: {
          filter: { globalId: item.productId },
          update: { $inc: { stock: item.quantity } },
        },
      }));
      await Product.bulkWrite(stockUpdates, { session });

      if (order.couponCode) {
        const coupon = await Coupon.findOne({ code: order.couponCode.toLowerCase() }).session(session);
        if (coupon) {
          coupon.usedCount = Math.max(0, coupon.usedCount - 1);
          await coupon.save({ session });
        }
      }

      order.status = 'cancelled';
      order.deliveryStatus = 'cancelled';
      order.updatedAt = new Date();
      order.deliveryUpdates.push({
        status: 'cancelled',
        updatedBy: req.user.id,
        timestamp: new Date(),
      });
      await order.save({ session });

      await notifyOnOrderCancelled(order, session);

      await session.commitTransaction();
      res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
      await session.abortTransaction();
      console.error('Cancel order error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.id })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    const totalOrders = await Order.countDocuments({ userId: req.user.id });

    res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    const totalOrders = await Order.countDocuments();

    res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
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

      if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
        const stockUpdates = order.items.map(item => ({
          updateOne: {
            filter: { globalId: item.productId },
            update: { $inc: { stock: item.quantity } },
          },
        }));
        await Product.bulkWrite(stockUpdates, { session });

        if (order.couponCode) {
          const coupon = await Coupon.findOne({ code: order.couponCode.toLowerCase() }).session(session);
          if (coupon) {
            coupon.usedCount = Math.max(0, coupon.usedCount - 1);
            await coupon.save({ session });
          }
        }
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

const exportOrders = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const orders = await Order.find().lean();

    const csvWriter = require('csv-writer').createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'Order ID' },
        { id: 'userId', title: 'User ID' },
        { id: 'orderDate', title: 'Order Date' },
        { id: 'total', title: 'Total Amount' },
        { id: 'status', title: 'Status' },
        { id: 'shippingAddress', title: 'Shipping Address' },
        { id: 'items', title: 'Items' },
      ],
      fieldDelimiter: ',',
    });

    const records = orders.map(order => ({
      id: order.id,
      userId: order.userId,
      orderDate: new Date(order.orderDate).toISOString(),
      total: order.total,
      status: order.status,
      shippingAddress: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.zipCode}`,
      items: order.items.map(item => `${item.name} (Qty: ${item.quantity}, Price: ${item.price})`).join('; '),
    }));

    const csvData = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Export orders error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createOrder, cancelOrder, getUserOrders, getOrder, getAllOrders, updateOrderStatus, exportOrders };