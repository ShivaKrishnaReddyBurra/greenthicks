const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const { notifyOnDeliveryStatus } = require('./notificationController');

const assignDeliveryBoy = [
  param('globalId').isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('deliveryBoyId').isInt({ min: 1 }).withMessage('Invalid delivery boy ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { globalId } = req.params;
    const { deliveryBoyId } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ globalId }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      const deliveryBoy = await User.findOne({ globalId: deliveryBoyId }).session(session);
      if (!deliveryBoy || !deliveryBoy.isDeliveryBoy) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Invalid or non-delivery boy ID' });
      }

      if (!deliveryBoy.activeStatus) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Delivery boy is offline' });
      }

      order.deliveryBoyId = deliveryBoyId;
      order.deliveryStatus = 'assigned';
      order.deliveryUpdates.push({
        status: 'assigned',
        updatedBy: req.user.id,
      });

      await order.save({ session });
      await notifyOnDeliveryStatus(order, 'assigned', session);

      await session.commitTransaction();
      res.json({ message: 'Delivery boy assigned successfully', order });
    } catch (error) {
      await session.abortTransaction();
      console.error('Assign delivery boy error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const updateDeliveryStatus = [
  param('globalId').isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('status').isIn(['assigned', 'out-for-delivery', 'delivered']).withMessage('Invalid delivery status'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { globalId } = req.params;
    const { status } = req.body;

    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Delivery boy or admin access required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ globalId }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.deliveryBoyId !== req.user.id && !req.user.isAdmin) {
        await session.abortTransaction();
        return res.status(403).json({ message: 'Unauthorized: Not assigned to this order' });
      }

      order.deliveryStatus = status;
      order.deliveryUpdates.push({
        status,
        updatedBy: req.user.id,
      });

      if (status === 'delivered') {
        order.status = 'delivered';
        order.updatedAt = new Date();
        const deliveryBoy = await User.findOne({ globalId: order.deliveryBoyId }).session(session);
        if (deliveryBoy) {
          deliveryBoy.ordersDelivered += 1;
          await deliveryBoy.save({ session });
        }
      }

      await order.save({ session });
      await notifyOnDeliveryStatus(order, status, session);

      await session.commitTransaction();
      res.json({ message: 'Delivery status updated successfully', order });
    } catch (error) {
      await session.abortTransaction();
      console.error('Update delivery status error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getDeliveryOrders = async (req, res) => {
  try {
    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Delivery boy or admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = req.user.isAdmin ? {} : { deliveryBoyId: req.user.id, deliveryStatus: { $ne: 'delivered' } };
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    const totalOrders = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Get delivery orders error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const setDeliveryBoyRole = [
  param('globalId').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('isDeliveryBoy').isBoolean().withMessage('isDeliveryBoy must be a boolean'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { globalId } = req.params;
    const { isDeliveryBoy } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ globalId }).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      user.isDeliveryBoy = isDeliveryBoy;
      await user.save({ session });

      await session.commitTransaction();
      res.json({ message: 'Delivery boy role updated successfully', user });
    } catch (error) {
      await session.abortTransaction();
      console.error('Set delivery boy role error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getDeliveryBoyById = [
  param('globalId').isInt({ min: 1 }).withMessage('Invalid user ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin && !req.user.isDeliveryBoy) {
      return res.status(403).json({ message: 'Unauthorized: Admin or delivery boy access required' });
    }

    const { globalId } = req.params;

    try {
      const user = await User.findOne({ globalId, isDeliveryBoy: true });
      if (!user) {
        return res.status(404).json({ message: 'Delivery boy not found' });
      }

      res.json({
        globalId: user.globalId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.address?.city || 'Unknown',
        ordersDelivered: user.ordersDelivered || 0,
        activeStatus: user.activeStatus,
      });
    } catch (error) {
      console.error('Get delivery boy error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

const toggleActiveStatus = [
  async (req, res) => {
    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Delivery boy or admin access required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ globalId: req.user.id }).session(session);
      if (!user || !user.isDeliveryBoy) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Delivery boy not found' });
      }

      user.activeStatus = !user.activeStatus;
      await user.save({ session });

      await session.commitTransaction();
      res.json({ message: `Active status updated to ${user.activeStatus ? 'online' : 'offline'}`, activeStatus: user.activeStatus });
    } catch (error) {
      await session.abortTransaction();
      console.error('Toggle active status error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

module.exports = { assignDeliveryBoy, updateDeliveryStatus, getDeliveryOrders, setDeliveryBoyRole, getDeliveryBoyById, toggleActiveStatus };