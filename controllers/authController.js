const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const redis = require('redis');
const { sendOTP, sendWelcomeEmail } = require('../services/emailService');
const generateOTP = require('../utils/generateOTP');

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(err => console.error('Redis connection error:', err));

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

      user = new User({
        email,
        password: await bcrypt.hash(password, 10),
      });
      await user.save();
      console.log('User saved successfully:', email);

      const otp = generateOTP();
      console.log('Generated OTP:', otp);

      try {
        await redisClient.setEx(`otp:${email}`, 600, otp);
        console.log('OTP stored in Redis for:', email);
      } catch (redisError) {
        console.error('Redis error:', redisError);
        throw new Error('Failed to store OTP in Redis');
      }

      try {
        await sendOTP(email, otp);
        console.log('OTP email sent to:', email);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        throw new Error('Failed to send OTP email');
      }

      res.status(201).json({ message: 'User created. Please verify your email.' });
    } catch (error) {
      console.error('Signup error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedOTP = await redisClient.get(`otp:${email}`);
    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = true;
    await user.save();

    await redisClient.del(`otp:${email}`);
    await sendWelcomeEmail(email);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

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
      if (!user.isVerified) return res.status(400).json({ message: 'Email not verified' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
];

module.exports = { signup, verifyEmail, login };