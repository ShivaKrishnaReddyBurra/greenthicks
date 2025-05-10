const express = require('express');
const { addToFavorites, removeFromFavorites, getFavorites, clearFavorites } = require('../controllers/favoritesController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Favorites routes
router.post('/', authenticate, addToFavorites);
router.delete('/:productId', authenticate, removeFromFavorites);
router.get('/', authenticate, getFavorites);
router.delete('/', authenticate, clearFavorites);

module.exports = router;