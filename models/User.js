const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  globalId: { type: Number, required: true, unique: true },
  id: { type: String, unique: true }, // USR-001 format
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  name: { type: String }, // Computed from firstName + lastName
  location: { type: String }, // Computed from city
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  joinedDate: { type: String, default: new Date().toISOString().split('T')[0] },
});

// Pre-save hook to generate id and computed fields
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate USR-XXX format ID
    const counter = await mongoose.model('Counter').findOneAndUpdate(
      { name: 'userId' },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );
    this.id = `USR-${String(counter.sequence).padStart(3, '0')}`;
  }
  
  // Compute name and location
  this.name = `${this.firstName} ${this.lastName}`.trim();
  this.location = this.city;
  next();
});

module.exports = mongoose.model('User', userSchema);