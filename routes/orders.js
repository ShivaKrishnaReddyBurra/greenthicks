const express = require('express');
const { createOrder, getUserOrders, getOrder, getAllOrders, updateOrderStatus, exportOrders } = require('../controllers/orderController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// User routes
router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getUserOrders);
router.get('/:globalId', authenticate, getOrder);

// Admin routes
router.get('/', authenticate, getAllOrders);
router.put('/:globalId/status', authenticate, updateOrderStatus);
router.get('/export', authenticate, exportOrders);

module.exports = router;