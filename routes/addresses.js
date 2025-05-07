const express = require('express');
const { addAddress, updateAddress, deleteAddress, getAddresses } = require('../controllers/addressController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticate, addAddress);
router.put('/:addressId', authenticate, updateAddress);
router.delete('/:addressId', authenticate, deleteAddress);
router.get('/', authenticate, getAddresses);

module.exports = router;