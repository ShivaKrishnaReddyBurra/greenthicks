const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { signup, login, updateUser, getAllUsers, getUserProfile, getUserDetails, deleteUser } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

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

module.exports = router;