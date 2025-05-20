const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: '0s' } }, // Auto-delete after expiration
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);