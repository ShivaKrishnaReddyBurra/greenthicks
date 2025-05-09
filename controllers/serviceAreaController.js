const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const ServiceArea = require('../models/ServiceArea');

const addServiceArea = [
  body('pincode').trim().matches(/^\d{5,6}$/).withMessage('Pincode must be 5 or 6 digits'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { pincode, city, state, isActive = true } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingArea = await ServiceArea.findOne({ pincode }).session(session);
      if (existingArea) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Pincode already exists' });
      }

      const serviceArea = new ServiceArea({
        pincode,
        city,
        state,
        isActive,
      });

      await serviceArea.save({ session });

      await session.commitTransaction();
      res.status(201).json({ message: 'Service area added successfully', serviceArea });
    } catch (error) {
      await session.abortTransaction();
      console.error('Add service area error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const updateServiceArea = [
  param('pincode').trim().matches(/^\d{5,6}$/).withMessage('Invalid pincode'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { pincode } = req.params;
    const { city, state, isActive } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const serviceArea = await ServiceArea.findOne({ pincode }).session(session);
      if (!serviceArea) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Service area not found' });
      }

      if (city) serviceArea.city = city;
      if (state) serviceArea.state = state;
      if (isActive !== undefined) serviceArea.isActive = isActive;
      serviceArea.updatedAt = new Date();

      await serviceArea.save({ session });

      await session.commitTransaction();
      res.json({ message: 'Service area updated successfully', serviceArea });
    } catch (error) {
      await session.abortTransaction();
      console.error('Update service area error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const deleteServiceArea = [
  param('pincode').trim().matches(/^\d{5,6}$/).withMessage('Invalid pincode'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { pincode } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const serviceArea = await ServiceArea.findOneAndDelete({ pincode }).session(session);
      if (!serviceArea) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Service area not found' });
      }

      await session.commitTransaction();
      res.json({ message: 'Service area deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      console.error('Delete service area error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getServiceAreas = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const serviceAreas = await ServiceArea.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalAreas = await ServiceArea.countDocuments();

    res.json({
      serviceAreas,
      totalPages: Math.ceil(totalAreas / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Get service areas error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const checkServiceAvailability = async (req, res) => {
  const { pincode } = req.query;

  if (!pincode || !/^\d{5,6}$/.test(pincode)) {
    return res.status(400).json({ message: 'Valid pincode is required' });
  }

  try {
    const serviceArea = await ServiceArea.findOne({ pincode, isActive: true });
    if (!serviceArea) {
      return res.status(404).json({ message: 'Service not available in this area' });
    }

    res.json({ message: 'Service available', serviceArea });
  } catch (error) {
    console.error('Check service availability error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { addServiceArea, updateServiceArea, deleteServiceArea, getServiceAreas, checkServiceAvailability };