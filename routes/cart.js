const express = require('express');
const { addToCart, removeFromCart, getCart, clearCart, updateCart } = require('../controllers/cartController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Cart routes
router.post('/', authenticate, addToCart, updateCart);
router.delete('/item/:productId', authenticate, removeFromCart);
router.get('/', authenticate, getCart);
router.delete('/', authenticate, clearCart);

module.exports = router;