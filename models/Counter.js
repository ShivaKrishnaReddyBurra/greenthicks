const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);