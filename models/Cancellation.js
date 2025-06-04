const mongoose = require("mongoose")

const cancellationSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  refundAmount: {
    type: Number,
  },
  refundStatus: {
    type: String,
    enum: ["Pending Refund", "Refunded", "Not Applicable"],
    default: "Pending Refund",
  },
  refundMethod: {
    type: String,
    enum: ["original", "cash", "store_credit"],
  },
  refundTransactionId: {
    type: String,
  },
  refundInitiatedDate: {
    type: Date,
  },
  refundDate: {
    type: Date,
  },
  paymentId: {
    type: String,
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  deliveryNote: {
    type: String,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedAt: {
    type: Date,
  },
  refundProcessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field before saving
cancellationSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model("Cancellation", cancellationSchema)
