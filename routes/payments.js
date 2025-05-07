const express = require('express');
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/create', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);

module.exports = router;