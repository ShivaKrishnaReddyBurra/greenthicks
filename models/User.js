const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  globalId: { type: Number, required: true, unique: true },
  id: { type: String, unique: true }, // USR-001 format
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  username: { type: String, unique: true, sparse: true },
  addresses: [{
    addressId: { type: Number, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    isPrimary: { type: Boolean, default: false },
  }],
  name: { type: String },
  location: { type: String },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  isAdmin: { type: Boolean, default: false },
  isDeliveryBoy: { type: Boolean, default: false },
  activeStatus: { type: Boolean, default: true },
  ordersDelivered: { type: Number, default: 0 },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  joinedDate: { type: String, default: new Date().toISOString().split('T')[0] },
});

// Pre-save hook to generate id and computed fields
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    const counter = await mongoose.model('Counter').findOneAndUpdate(
      { name: 'userId' },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );
    this.id = `USR-${String(counter.sequence).padStart(3, '0')}`;
  }
  
  // Compute name from firstName and lastName if available, else from addresses
  if (this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  } else {
    const primaryAddress = this.addresses.find(addr => addr.isPrimary);
    if (primaryAddress) {
      this.name = `${primaryAddress.firstName} ${primaryAddress.lastName}`.trim();
      this.location = primaryAddress.city;
    } else if (this.addresses.length > 0) {
      this.name = `${this.addresses[0].firstName} ${this.addresses[0].lastName}`.trim();
      this.location = this.addresses[0].city;
    }
  }
  
  const primaryAddresses = this.addresses.filter(addr => addr.isPrimary);
  if (primaryAddresses.length > 1) {
    primaryAddresses.slice(1).forEach(addr => (addr.isPrimary = false));
  }
  
  if (this.isAdmin && this.isDeliveryBoy === false) {
    this.isDeliveryBoy = true;
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);