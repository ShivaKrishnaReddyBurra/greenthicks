const mongoose = require('mongoose');
const Counter = require('./Counter');

// Defining the coupon schema
const couponSchema = new mongoose.Schema({
  globalId: { type: Number, unique: true, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, required: true, enum: ['percentage', 'fixed', 'free_delivery'] },
  discountValue: { type: Number, required: true, min: 0 },
  minimumOrderAmount: { type: Number, default: 0, min: 0 },
  maxUses: { type: Number, default: 0, min: 0 }, // 0 means unlimited
  usedCount: { type: Number, default: 0, min: 0 },
  expiryDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Creating a new coupon with globalId
couponSchema.statics.createNewCoupon = async function(couponData, session) {
  try {
    // Generate globalId from counter
    const options = { new: true, upsert: true };
    if (session) options.session = session;

    console.log('Attempting to update Counter with name: couponId');
    const counter = await Counter.findOneAndUpdate(
      { name: 'couponId' },
      { $inc: { sequence: 1 } },
      options
    );

    if (!counter) {
      throw new Error('Failed to generate coupon counter');
    }

    console.log('Counter updated:', counter);

    // Create coupon object with generated globalId
    const couponObject = {
      ...couponData,
      globalId: counter.sequence,
      code: couponData.code.toUpperCase(),
    };

    // Create and return the new coupon
    return new this(couponObject);
  } catch (error) {
    console.error('Error creating new coupon:', error.message);
    throw error;
  }
};

// Updating fields before saving
couponSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isNew) {
    this.code = this.code.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Coupon', couponSchema);