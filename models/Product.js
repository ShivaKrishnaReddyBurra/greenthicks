const mongoose = require('mongoose');

// Define the schema for nutrition facts
const nutritionSchema = new mongoose.Schema({
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  vitamins: [{
    name: { type: String, required: true },
    amount: { type: String, required: true },
    daily: { type: String }
  }]
});

// Define the schema for product policies
const policySchema = new mongoose.Schema({
  return: { type: String, default: '' },
  shipping: { type: String, default: '' },
  availability: { type: String, default: '' }
});

// Define the schema for product reviews
const reviewSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  approved: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  images: [{ type: String }], // Added to store review image URLs
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  globalId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { 
    type: String, 
    required: true, 
    enum: ['leafy', 'fruit', 'root', 'herbs', 'milk', 'pulses', 'grains', 'spices', 'nuts', 'oils', 'snacks', 'beverages'] 
  },
  unit: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  seasonal: { type: Boolean, default: false },
  new: { type: Boolean, default: false },
  organic: { type: Boolean, default: false },
  tags: [{ type: String }],
  sku: { type: String, unique: true },
  published: { type: Boolean, default: false },
  nutrition: { type: nutritionSchema, default: () => ({}) },
  policies: { type: policySchema, default: () => ({}) },
  reviews: [reviewSchema],
  images: [{
    url: { type: String, required: true },
    primary: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to ensure only one image is primary
productSchema.pre('save', function(next) {
  const primaryImages = this.images.filter(img => img.primary);
  if (primaryImages.length > 1) {
    this.images.forEach((img, index) => {
      img.primary = index === this.images.findIndex(i => i.primary);
    });
  } else if (primaryImages.length === 0 && this.images.length > 0) {
    this.images[0].primary = true;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);