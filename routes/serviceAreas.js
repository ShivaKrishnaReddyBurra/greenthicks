const express = require('express');
const { addServiceArea, updateServiceArea, deleteServiceArea, getServiceAreas, checkServiceAvailability } = require('../controllers/serviceAreaController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Admin routes
router.post('/', authenticate, addServiceArea);
router.put('/:pincode', authenticate, updateServiceArea);
router.delete('/:pincode', authenticate, deleteServiceArea);
router.get('/', authenticate, getServiceAreas);

// Public route
router.get('/check', checkServiceAvailability);

module.exports = router;