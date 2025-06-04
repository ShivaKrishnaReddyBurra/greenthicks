const mongoose = require("mongoose")

const returnSchema = new mongoose.Schema({
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
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
      },
      reason: {
        type: String,
        required: true,
      },
    },
  ],
  reason: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  photos: [
    {
      type: String,
    },
  ],
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  refundAmount: {
    type: Number,
  },
  refundStatus: {
    type: String,
    enum: ["Pending", "Refunded", "Not Applicable"],
    default: "Pending",
  },
  refundPreference: {
    type: String,
    enum: ["original", "cash", "store_credit"],
    default: "original",
  },
  refundMethod: {
    type: String,
    enum: ["original", "cash", "store_credit"],
  },
  paymentDetails: {
    type: Object,
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
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  deliveryNote: {
    type: String,
  },
  feedback: {
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
returnSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model("Return", returnSchema)
