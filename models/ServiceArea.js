// models/ServiceArea.js
const mongoose = require("mongoose");

const serviceAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
      required: true,
    },
    coordinates: {
      type: Array,
      required: true,
    },
  },
  active: {
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
    unique: true,
    trim: true,
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
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Create 2dsphere index for geospatial queries
serviceAreaSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("ServiceArea", serviceAreaSchema);