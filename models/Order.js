const mongoose = require('mongoose');
const Counter = require('./Counter');

const orderSchema = new mongoose.Schema({
  globalId: { type: Number, required: true, unique: true },
  id: { type: String, unique: true }, // ORD-XXX format
  userId: { type: Number, required: true }, // References User.globalId
  items: [{
    productId: { type: Number, required: true }, // References Product.globalId
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  }],
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  couponCode: { type: String, default: '' },
  paymentMethod: { type: String, required: true, enum: ['credit-card', 'upi', 'cash-on-delivery'] },
  paymentStatus: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  status: { type: String, default: 'processing', enum: ['processing', 'shipped', 'delivered', 'cancelled'] },
  orderDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Static method to generate a new order with all required fields
orderSchema.statics.createNewOrder = async function(orderData, session) {
  try {
    // First generate the ID from the counter
    const options = { new: true, upsert: true };
    if (session) options.session = session;
    
    const counter = await Counter.findOneAndUpdate(
      { name: 'orderId' },
      { $inc: { sequence: 1 } },
      options
    );
    
    if (!counter) {
      throw new Error('Failed to generate order counter');
    }

    // Create order object with generated IDs
    const orderObject = {
      ...orderData,
      globalId: counter.sequence,
      id: `ORD-${String(counter.sequence).padStart(3, '0')}`,
    };

    // Set delivery date to 24 hours from orderDate
    const deliveryDate = new Date(orderObject.orderDate || Date.now());
    deliveryDate.setHours(deliveryDate.getHours() + 24);
    orderObject.deliveryDate = deliveryDate;

    console.log('Creating order with globalId:', orderObject.globalId);
    
    // Create and return the new order
    return new this(orderObject);
  } catch (error) {
    console.error('Error creating new order:', error);
    throw error;
  }
};

module.exports = mongoose.model('Order', orderSchema);