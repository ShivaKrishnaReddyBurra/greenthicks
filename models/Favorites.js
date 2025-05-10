const mongoose = require('mongoose');

const favoritesSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true }, // References User.globalId
  products: [{
    productId: { type: Number, required: true }, // References Product.globalId
  }],
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
favoritesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Favorites', favoritesSchema);