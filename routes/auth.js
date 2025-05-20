const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { signup, login, updateUser, getAllUsers, getUserProfile, getUserDetails, deleteUser } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const crypto = require('crypto');
const {sendVerificationEmail} = require('../services/emailService');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/user/:globalId', authenticate, updateUser);
router.get('/users', authenticate, getAllUsers);
router.get('/profile', authenticate, getUserProfile);
router.get('/user/:globalId/details', authenticate, getUserDetails);
router.delete('/user/:globalId', authenticate, deleteUser);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = jwt.sign({ id: req.user.globalId, isAdmin: req.user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.redirect(`/?token=${token}`);
});

// Email verification endpoint
router.get('/verify-email', [
  query('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  query('token').notEmpty().withMessage('Token is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, token } = req.query;

  try {
    const verificationToken = await VerificationToken.findOne({ email, token });
    if (!verificationToken) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    user.isVerified = true;
    await user.save();

    await VerificationToken.deleteOne({ email, token });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email is already verified' });

    await VerificationToken.deleteMany({ email }); // Remove any existing tokens

    const token = crypto.randomBytes(32).toString('hex');
    const verificationToken = new VerificationToken({
      email,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await verificationToken.save();

    await sendVerificationEmail(email, token);

    res.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;