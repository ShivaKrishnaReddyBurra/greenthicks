const mongoose = require("mongoose")

const cancellationSchema = new mongoose.Schema({
  orderId: {
    type: Number,
    required: true,
    ref: "Order",
  },
  userId: {
    type: Number,
    required: true,
    ref: "User",
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "processed"],
    default: "pending",
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  processedDate: {
    type: Date,
  },
  orderTotal: {
    type: Number,
    required: true,
  },
  refundAmount: {
    type: Number,
    required: true,
  },
  adminNotes: {
    type: String,
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

module.exports = mongoose.model("Cancellation", cancellationSchema)
