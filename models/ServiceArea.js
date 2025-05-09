const mongoose = require('mongoose');

const serviceAreaSchema = new mongoose.Schema({
  pincode: { type: String, required: true, unique: true, match: /^\d{5,6}$/ },
  city: { type: String, required: true },
  state: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ServiceArea', serviceAreaSchema);