const express = require('express');
const { assignDeliveryBoy, updateDeliveryStatus, getDeliveryOrders, setDeliveryBoyRole, getDeliveryBoyById, toggleActiveStatus } = require('../controllers/deliveryController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Admin routes
router.post('/:globalId/assign', authenticate, assignDeliveryBoy);
router.put('/user/:globalId/delivery-role', authenticate, setDeliveryBoyRole);
router.get('/user/:globalId', authenticate, getDeliveryBoyById);

// Delivery boy and admin routes
router.put('/:globalId/status', authenticate, updateDeliveryStatus);
router.get('/', authenticate, getDeliveryOrders);
router.put('/active-status', authenticate, toggleActiveStatus);

module.exports = router;