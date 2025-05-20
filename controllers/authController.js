const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const Counter = require('../models/Counter');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const VerificationToken = require('../models/VerificationToken');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/emailService');
const crypto = require('crypto');

const signup = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('username').notEmpty().trim().withMessage('Username is required'),
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, firstName, lastName, username, isAdmin } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'Email already exists' });

      user = await User.findOne({ username });
      if (user) return res.status(400).json({ message: 'Username already exists' });

      const counter = await Counter.findOneAndUpdate(
        { name: 'userId' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      user = new User({
        globalId: counter.sequence,
        email,
        password: await bcrypt.hash(password, 10),
        firstName,
        lastName,
        username,
        isAdmin: isAdmin || false,
        isVerified: false, // Ensure user is not verified initially
      });
      await user.save();

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const verificationToken = new VerificationToken({
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      });
      await verificationToken.save();

      // Send verification email
      await sendVerificationEmail(email, token);
      await sendWelcomeEmail(email);

      res.status(201).json({ message: 'User created successfully. Please verify your email to activate your account.' });
    } catch (error) {
      console.error('Signup error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

const login = [
  body('identifier').notEmpty().trim().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { identifier, password } = req.body;

    try {
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      // Optional: Restrict login for unverified users
      if (!user.isVerified) {
        return res.status(403).json({ message: 'Please verify your email before logging in.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.globalId, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: {
          globalId: user.globalId,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

const updateUser = [
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('username').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zipCode').optional().trim(),
  body('isAdmin').optional().isBoolean(),
  body('isDeliveryBoy').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, firstName, lastName, username, phone, address, city, state, zipCode, isAdmin, isDeliveryBoy } = req.body;
    const globalId = parseInt(req.params.globalId);
    const requestingUser = req.user;

    try {
      if (requestingUser.id !== globalId && !requestingUser.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized to update this user' });
      }

      const user = await User.findOne({ globalId });
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.globalId !== globalId) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
      }
      if (username) {
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser.globalId !== globalId) {
          return res.status(400).json({ message: 'Username already in use' });
        }
        user.username = username;
      }
      if (password) user.password = await bcrypt.hash(password, 10);
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (zipCode !== undefined) user.zipCode = zipCode;
      if (isAdmin !== undefined && requestingUser.isAdmin) user.isAdmin = isAdmin;
      if (isDeliveryBoy !== undefined && requestingUser.isAdmin) user.isDeliveryBoy = isDeliveryBoy;

      await user.save();

      res.json({ 
        message: 'User updated successfully',
        user: {
          globalId: user.globalId,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          phone: user.phone,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          name: user.name,
          location: user.location,
          totalOrders: user.totalOrders,
          totalSpent: user.totalSpent,
          status: user.status,
          joinedDate: user.joinedDate,
          isAdmin: user.isAdmin,
          isDeliveryBoy: user.isDeliveryBoy,
          isVerified: user.isVerified,
        }
      });
    } catch (error) {
      console.error('Update user error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

const getAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const users = await User.find().select('-password -googleId');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ globalId: req.user.id }).select('-password -googleId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      globalId: user.globalId,
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      name: user.name,
      location: user.location,
      totalOrders: user.totalOrders,
      totalSpent: user.totalSpent,
      status: user.status,
      joinedDate: user.joinedDate,
      isAdmin: user.isAdmin,
      isDeliveryBoy: user.isDeliveryBoy,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserDetails = [
  param('globalId').isInt({ min: 1 }).withMessage('Invalid user ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const globalId = parseInt(req.params.globalId);
    const requestingUser = req.user;

    try {
      if (requestingUser.id !== globalId && !requestingUser.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized to view this user\'s details' });
      }

      const user = await User.findOne({ globalId }).select('-password -googleId');
      if (!user) return res.status(404).json({ message: 'User not found' });

      const cart = await Cart.findOne({ userId: globalId }) || { userId: globalId, items: [] };

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const orders = await Order.find({ userId: globalId })
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit);
      const totalOrders = await Order.countDocuments({ userId: globalId });

      const userDetails = {
        globalId: user.globalId,
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        name: user.name,
        location: user.location,
        totalOrders: user.totalOrders,
        totalSpent: user.totalSpent,
        status: user.status,
        joinedDate: user.joinedDate,
        isAdmin: user.isAdmin,
        isDeliveryBoy: user.isDeliveryBoy,
        isVerified: user.isVerified,
        addresses: user.addresses,
        cart: {
          items: cart.items,
          updatedAt: cart.updatedAt,
        },
        orders: {
          data: orders,
          totalPages: Math.ceil(totalOrders / limit),
          currentPage: page,
        },
      };

      res.json(userDetails);
    } catch (error) {
      console.error('Get user details error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

const deleteUser = async (req, res) => {
  const globalId = parseInt(req.params.globalId);
  const requestingUser = req.user;

  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const user = await User.findOne({ globalId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.deleteOne({ globalId });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { signup, login, updateUser, getAllUsers, getUserProfile, getUserDetails, deleteUser };