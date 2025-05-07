const express = require('express');
const { createCoupon, updateCoupon, deleteCoupon, getCoupons, validateCoupon } = require('../controllers/couponController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticate, createCoupon);
router.put('/:couponId', authenticate, updateCoupon);
router.delete('/:couponId', authenticate, deleteCoupon);
router.get('/', authenticate, getCoupons);
router.post('/validate', authenticate, validateCoupon);

module.exports = router;