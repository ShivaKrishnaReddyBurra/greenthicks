const { body, check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

// Creating a new coupon
const createCoupon = [
  // Checking admin authorization
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  // Validating request body
  body('code').notEmpty().trim().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed', 'free_delivery']).withMessage('Invalid discount type'),
  body('discountValue').custom((value, { req }) => {
    if (req.body.discountType === 'free_delivery') return value === 0;
    return value > 0;
  }).withMessage('Discount value must be positive for percentage/fixed, or 0 for free delivery'),
  body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  body('maxUses').optional().isInt({ min: 0 }).withMessage('Max uses must be non-negative'),
  body('expiryDate').isISO8601().withMessage('Invalid expiry date'),
  // Handling coupon creation
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { code, discountType, discountValue, minimumOrderAmount, maxUses, expiryDate } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() }).session(session);
      if (existingCoupon) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Coupon code already exists' });
      }

      const couponData = {
        code,
        discountType,
        discountValue: discountType === 'free_delivery' ? 0 : discountValue,
        minimumOrderAmount: minimumOrderAmount || 0,
        maxUses: maxUses || 0,
        expiryDate,
      };

      const coupon = await Coupon.createNewCoupon(couponData, session);
      await coupon.save({ session });

      await session.commitTransaction();
      res.status(201).json({ message: 'Coupon created successfully', coupon });
    } catch (error) {
      await session.abortTransaction();
      console.error('Create coupon error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Updating an existing coupon
const updateCoupon = [
  // Checking admin authorization
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  // Validating coupon ID and request body
  check('couponId').isInt({ min: 1 }).withMessage('Invalid coupon ID'),
  body('discountType').optional().isIn(['percentage', 'fixed', 'free_delivery']).withMessage('Invalid discount type'),
  body('discountValue').optional().custom((value, { req }) => {
    if (req.body.discountType === 'free_delivery') return value === 0;
    return value > 0;
  }).withMessage('Discount value must be positive for percentage/fixed, or 0 for free delivery'),
  body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  body('maxUses').optional().isInt({ min: 0 }).withMessage('Max uses must be non-negative'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  // Handling coupon update
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { code, discountType, discountValue, minimumOrderAmount, maxUses, expiryDate, active } = req.body;
    const couponId = parseInt(req.params.couponId);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const coupon = await Coupon.findOne({ globalId: couponId }).session(session);
      if (!coupon) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Coupon not found' });
      }

      if (code) coupon.code = code.toUpperCase();
      if (discountType) coupon.discountType = discountType;
      if (discountValue !== undefined) coupon.discountValue = discountType === 'free_delivery' ? 0 : discountValue;
      if (minimumOrderAmount !== undefined) coupon.minimumOrderAmount = minimumOrderAmount;
      if (maxUses !== undefined) coupon.maxUses = maxUses;
      if (expiryDate) coupon.expiryDate = expiryDate;
      if (active !== undefined) coupon.active = active;

      await coupon.save({ session });
      await session.commitTransaction();
      res.json({ message: 'Coupon updated successfully', coupon });
    } catch (error) {
      await session.abortTransaction();
      console.error('Update coupon error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Deleting a coupon
const deleteCoupon = [
  // Checking admin authorization
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  // Validating coupon ID
  check('couponId').isInt({ min: 1 }).withMessage('Invalid coupon ID'),
  // Handling coupon deletion
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const couponId = parseInt(req.params.couponId);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const coupon = await Coupon.findOne({ globalId: couponId }).session(session);
      if (!coupon) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Coupon not found' });
      }

      await Coupon.deleteOne({ globalId: couponId }).session(session);
      await session.commitTransaction();
      res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      console.error('Delete coupon error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Retrieving all coupons
const getCoupons = [
  // Checking admin authorization
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  // Handling coupons retrieval
  async (req, res) => {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      res.json(coupons);
    } catch (error) {
      console.error('Get coupons error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

// Validating a coupon
const validateCoupon = [
  // Validating request body
  body('code').notEmpty().trim().withMessage('Coupon code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be positive'),
  // Handling coupon validation
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { code, subtotal } = req.body;

    try {
      const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }
      if (coupon.expiryDate < new Date()) {
        return res.status(400).json({ message: 'Coupon has expired' });
      }
      if (coupon.minimumOrderAmount > subtotal) {
        return res.status(400).json({ message: `Minimum order amount for coupon is ${coupon.minimumOrderAmount}` });
      }
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ message: 'Coupon usage limit reached' });
      }

      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = subtotal * (coupon.discountValue / 100);
      } else if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
      } else if (coupon.discountType === 'free_delivery') {
        discount = 0; // Free delivery coupons don't affect subtotal directly
      }

res.json({ 
  message: 'Coupon valid',
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  discount,
  isFreeDelivery: coupon.discountType === 'free_delivery'
});
    } catch (error) {
      console.error('Validate coupon error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

module.exports = { createCoupon, updateCoupon, deleteCoupon, getCoupons, validateCoupon };