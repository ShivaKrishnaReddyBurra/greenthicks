const express = require('express');
const { createCoupon, updateCoupon, deleteCoupon, getCoupons, validateCoupon } = require('../controllers/couponController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Route for creating a new coupon
router.post('/', authenticate, createCoupon);

// Route for updating an existing coupon
router.put('/:couponId', authenticate, updateCoupon);

// Route for deleting a coupon
router.delete('/:couponId', authenticate, deleteCoupon);

// Route for retrieving all coupons
router.get('/', authenticate, getCoupons);

// Route for validating a coupon
router.post('/validate', authenticate, validateCoupon);

module.exports = router;