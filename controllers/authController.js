const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Counter = require('../models/Counter');
const { sendWelcomeEmail } = require('../services/emailService');

const signup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'User already exists' });

      const counter = await Counter.findOneAndUpdate(
        { name: 'userId' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      user = new User({
        globalId: counter.sequence,
        email,
        password: await bcrypt.hash(password, 10),
      });
      await user.save();
      await sendWelcomeEmail(email);

      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Signup error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

const login = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user.globalId, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user: {
        globalId: user.globalId,
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      }});
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

const updateUser = [
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zipCode').optional().trim(),
  body('isAdmin').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, firstName, lastName, phone, address, city, state, zipCode, isAdmin } = req.body;
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
      if (password) user.password = await bcrypt.hash(password, 10);
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (zipCode !== undefined) user.zipCode = zipCode;
      if (isAdmin !== undefined && requestingUser.isAdmin) user.isAdmin = isAdmin;

      await user.save();

      res.json({ 
        message: 'User updated successfully',
        user: {
          globalId: user.globalId,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
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
          isAdmin: user.isAdmin
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
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const globalId = parseInt(req.params.globalId);
  const requestingUser = req.user;

  try {
    if (!requestingUser.isAdmin) {
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

module.exports = { signup, login, updateUser, getAllUsers, getUserProfile, deleteUser };