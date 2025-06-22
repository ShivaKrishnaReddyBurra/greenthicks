const mongoose = require("mongoose")

const serviceAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  geometry: {
    type: {
      type: String,
      enum: ["Polygon", "MultiPolygon"],
    },
    coordinates: {
      type: Array,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  estimatedDeliveryTime: {
    type: String,
    default: "30-45 minutes",
  },
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  pincode: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  centerLocation: {
    lat: {
      type: Number,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  deliveryRadius: {
    type: Number,
    default: 5,
    min: 0.1,
    max: 100,
  },
})

// Create indexes for performance
serviceAreaSchema.index({ geometry: "2dsphere" })
serviceAreaSchema.index({ centerLocation: "2dsphere" })
serviceAreaSchema.index({ isActive: 1, pincode: 1 })

module.exports = mongoose.model("ServiceArea", serviceAreaSchema)