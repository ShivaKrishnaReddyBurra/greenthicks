const { body, check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

const createCoupon = [
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  body('code').notEmpty().trim().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive'),
  body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  body('maxUses').optional().isInt({ min: 0 }).withMessage('Max uses must be non-negative'),
  body('expiryDate').isISO8601().withMessage('Invalid expiry date'),
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
        discountValue,
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

const updateCoupon = [
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  check('couponId').isInt({ min: 1 }).withMessage('Invalid coupon ID'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').optional().isFloat({ min: 0 }).withMessage('Discount value must be positive'),
  body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  body('maxUses').optional().isInt({ min: 0 }).withMessage('Max uses must be non-negative'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { discountType, discountValue, minimumOrderAmount, maxUses, expiryDate, active } = req.body;
    const couponId = parseInt(req.params.couponId);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const coupon = await Coupon.findOne({ globalId: couponId }).session(session);
      if (!coupon) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Coupon not found' });
      }

      if (discountType) coupon.discountType = discountType;
      if (discountValue !== undefined) coupon.discountValue = discountValue;
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

const deleteCoupon = [
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  check('couponId').isInt({ min: 1 }).withMessage('Invalid coupon ID'),
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

const getCoupons = [
  (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
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

const validateCoupon = [
  body('code').notEmpty().trim().withMessage('Coupon code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be positive'),
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

      const discount = coupon.discountType === 'percentage'
        ? subtotal * (coupon.discountValue / 100)
        : coupon.discountValue;

      res.json({ message: 'Coupon valid', discount });
    } catch (error) {
      console.error('Validate coupon error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

module.exports = { createCoupon, updateCoupon, deleteCoupon, getCoupons, validateCoupon };