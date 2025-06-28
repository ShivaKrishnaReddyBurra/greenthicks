const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  token: { type: String, required: true },
  type: { type: String, default: 'account-verification', enum: ['account-verification', 'password-reset', 'email-update', 'phone-update'] },
  newEmail: { type: String }, // For email update verification
  newPhone: { type: String }, // For phone update verification
  expiresAt: { type: Date, required: true, index: { expires: '0s' } }, // Auto-delete after expiration
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
