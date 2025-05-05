const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true }, // References User.globalId
  items: [{
    productId: { type: Number, required: true }, // References Product.globalId
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  }],
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);