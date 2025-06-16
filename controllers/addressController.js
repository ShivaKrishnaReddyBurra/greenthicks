const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Counter = require('../models/Counter');

const addAddress = [
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('address').notEmpty().trim().withMessage('Address is required'),
  body('city').notEmpty().trim().withMessage('City is required'),
  body('state').notEmpty().trim().withMessage('State is required'),
  body('zipCode').matches(/^\d{5,6}$/).withMessage('ZIP code must be 5 or 6 digits'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^(?:\+91\s?)?[6-9]\d{9}$/).withMessage('Phone number must be in Indian format (e.g., +91 9876543210)'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude for map location'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude for map location'),
  body('mapLocation.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid map location latitude'),
  body('mapLocation.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid map location longitude'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, address, city, state, zipCode, email, phone, isPrimary, location, lat, lng, mapLocation } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ globalId: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate addressId
      const counter = await Counter.findOneAndUpdate(
        { name: 'addressId' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session }
      );

      const newAddress = {
        addressId: counter.sequence,
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode,
        email,
        phone,
        location: location || {},
        lat: lat || null,
        lng: lng || null,
        mapLocation: mapLocation || null,
        isPrimary: isPrimary || false,
      };

      // If setting as primary, unset others
      if (isPrimary) {
        user.addresses.forEach(addr => (addr.isPrimary = false));
      }

      user.addresses.push(newAddress);
      await user.save({ session });

      await session.commitTransaction();
      res.status(201).json({ message: 'Address added successfully', address: newAddress });
    } catch (error) {
      await session.abortTransaction();
      console.error('Add address error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const updateAddress = [
  param('addressId').isInt({ min: 1 }).withMessage('Invalid address ID'),
  body('firstName').optional().notEmpty().trim().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().trim().withMessage('Last name cannot be empty'),
  body('address').optional().notEmpty().trim().withMessage('Address cannot be empty'),
  body('city').optional().notEmpty().trim().withMessage('City cannot be empty'),
  body('state').optional().notEmpty().trim().withMessage('State cannot be empty'),
  body('zipCode').optional().matches(/^\d{5,6}$/).withMessage('ZIP code must be 5 or 6 digits'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().matches(/^(?:\+91\s?)?[6-9]\d{9}$/).withMessage('Phone number must be in Indian format (e.g., +91 9876543210)'),
  body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude for map location'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude for map location'),
  body('mapLocation.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid map location latitude'),
  body('mapLocation.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid map location longitude'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, address, city, state, zipCode, email, phone, isPrimary, location, lat, lng, mapLocation } = req.body;
    const addressId = parseInt(req.params.addressId);
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ globalId: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      const targetAddress = user.addresses.find(addr => addr.addressId === addressId);
      if (!targetAddress) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Address not found' });
      }

      // Update fields if provided
      if (firstName) targetAddress.firstName = firstName;
      if (lastName) targetAddress.lastName = lastName;
      if (address) targetAddress.address = address;
      if (city) targetAddress.city = city;
      if (state) targetAddress.state = state;
      if (zipCode) targetAddress.zipCode = zipCode;
      if (email) targetAddress.email = email;
      if (phone) targetAddress.phone = phone;
      if (location) targetAddress.location = location;
      if (lat !== undefined) targetAddress.lat = lat;
      if (lng !== undefined) targetAddress.lng = lng;
      if (mapLocation) targetAddress.mapLocation = mapLocation;
      if (isPrimary !== undefined) {
        if (isPrimary) {
          user.addresses.forEach(addr => (addr.isPrimary = false));
          targetAddress.isPrimary = true;
        } else {
          targetAddress.isPrimary = false;
        }
      }

      await user.save({ session });

      await session.commitTransaction();
      res.json({ message: 'Address updated successfully', address: targetAddress });
    } catch (error) {
      await session.abortTransaction();
      console.error('Update address error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const deleteAddress = [
  param('addressId').isInt({ min: 1 }).withMessage('Invalid address ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const addressId = parseInt(req.params.addressId);
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ globalId: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      const addressIndex = user.addresses.findIndex(addr => addr.addressId === addressId);
      if (addressIndex === -1) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Address not found' });
      }

      user.addresses.splice(addressIndex, 1);
      await user.save({ session });

      await session.commitTransaction();
      res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      console.error('Delete address error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getAddresses = async (req, res) => {
  try {
    const user = await User.findOne({ globalId: req.user.id }).select('addresses');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses);
  } catch (error) {
    console.error('Get addresses error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { addAddress, updateAddress, deleteAddress, getAddresses };