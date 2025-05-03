const express = require('express');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:globalId', getProduct);

// Admin-only routes
router.post('/', authenticate, createProduct);
router.put('/:globalId', authenticate, updateProduct);
router.delete('/:globalId', authenticate, deleteProduct);

module.exports = router;