const { param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getInvoices = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalOrders = await Order.countDocuments();

    const invoices = orders.map(order => ({
      id: order.id,
      orderId: order.globalId,
      customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      amount: order.total,
      status: order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1),
      date: order.orderDate,
    }));

    res.json({
      invoices,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Get invoices error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const exportInvoices = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const orders = await Order.find().lean();

    const invoices = orders.map(order => ({
      id: order.id,
      orderId: order.globalId,
      customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      amount: order.total,
      status: order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1),
      date: new Date(order.orderDate).toISOString(),
    }));

    const csvWriter = require('csv-writer').createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'Invoice ID' },
        { id: 'orderId', title: 'Order ID' },
        { id: 'customer', title: 'Customer' },
        { id: 'date', title: 'Date' },
        { id: 'amount', title: 'Amount' },
        { id: 'status', title: 'Status' },
      ],
      fieldDelimiter: ',',
    });

    const csvData = csvWriter.getHeaderString() + csvWriter.stringifyRecords(invoices);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices_export.csv');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Export invoices error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const generateInvoice = [
  param('globalId').isInt({ min: 1 }).withMessage('Invalid order ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const globalId = parseInt(req.params.globalId);

    try {
      const order = await Order.findOne({ globalId });
      if (!order) return res.status(404).json({ message: 'Order not found' });

      if (order.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized to view this invoice' });
      }

      const user = await User.findOne({ globalId: order.userId });
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Determine response format based on Accept header
      const acceptHeader = req.get('Accept') || 'text/html';
      const isJson = acceptHeader.includes('application/json') || req.query.format === 'json';

      if (isJson) {
        // JSON response for frontend
        const invoiceData = {
          id: order.id,
          date: new Date(order.orderDate).toLocaleDateString('en-US'),
          customer: {
            name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            address: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
            email: user.email,
            phoneNumber: order.shippingAddress.phone
          },
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            total: item.price * item.quantity,
          })),
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount || 0,
          total: order.total,
          paymentMethod: order.paymentMethod.replace('-', ' ').toUpperCase(),
          paymentStatus: order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1),
        };
        return res.json(invoiceData);
      }

      // HTML response for direct browser access
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${order.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 1in;
      line-height: 1.4;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin: 0;
    }
    .header p {
      margin: 5px 0;
    }
    .billed-to, .payment-details {
      margin: 20px 0;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .table th, .table td {
      border: 1px solid #999;
      padding: 8px;
      text-align: left;
    }
    .table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .table .right-align {
      text-align: right;
    }
    .table .total-row {
      font-weight: bold;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
    }
    .download-btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #28a745;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
      cursor: pointer;
    }
    .download-btn:hover {
      background-color: #218838;
    }
    @media print {
      .download-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container" id="invoice">
    <div class="header">
      <h1>Invoice</h1>
      <p>GreenThicks</p>
      <p>Your address</p>
      <p>contact@greenthicks.com</p>
      <p>Invoice #${order.id}</p>
      <p>Date: ${new Date(order.orderDate).toLocaleDateString('en-US')}</p>
    </div>

    <div class="billed-to">
      <strong>Billed To:</strong><br>
      ${escapeHtml(order.shippingAddress.firstName)} ${escapeHtml(order.shippingAddress.lastName)}<br>
      ${escapeHtml(order.shippingAddress.address)}<br>
      ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.zipCode)}<br>
      Email: ${escapeHtml(user.email)}
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Unit</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th class="right-align">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            item => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${item.unit}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td class="right-align">$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `
          )
          .join('')}
        <tr>
          <td colspan="3" class="right-align">Subtotal</td>
          <td class="right-align">$${order.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" class="right-align">Delivery Charge</td>
          <td class="right-align">$${order.shipping.toFixed(2)}</td>
        </tr>
        ${order.discount > 0
          ? `
            <tr>
              <td colspan="3" class="right-align">Discount</td>
              <td class="right-align">-$${order.discount.toFixed(2)}</td>
            </tr>
          `
          : ''}
        <tr class="total-row">
          <td colspan="3" class="right-align">Total</td>
          <td class="right-align">$${order.total.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="payment-details">
      <strong>Payment Details:</strong><br>
      Method: ${escapeHtml(order.paymentMethod.replace('-', ' ').toUpperCase())}<br>
      Status: ${escapeHtml(order.paymentStatus)}
    </div>

    <div class="footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>For any questions, please contact us at contact@greenthicks.com.</p>
    </div>

    <a class="download-btn" onclick="downloadPDF()">Download as PDF</a>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    function downloadPDF() {
      const element = document.getElementById('invoice');
      const opt = {
        margin: 0.5,
        filename: 'invoice_${order.id}.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  </script>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(htmlContent);
    } catch (error) {
      console.error('Generate invoice error:', error.message, error.stack);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

module.exports = { getInvoices, exportInvoices, generateInvoice };