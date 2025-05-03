const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  globalId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, required: true, enum: ['leafy', 'fruit', 'root', 'herbs'] },
  unit: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  seasonal: { type: Boolean, default: false },
  new: { type: Boolean, default: false },
  images: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);