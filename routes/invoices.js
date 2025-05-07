const express = require('express');
const { getInvoices, exportInvoices, generateInvoice } = require('../controllers/invoiceController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/', authenticate, getInvoices);
router.get('/export', authenticate, exportInvoices);
router.get('/:globalId', authenticate, generateInvoice);

module.exports = router;