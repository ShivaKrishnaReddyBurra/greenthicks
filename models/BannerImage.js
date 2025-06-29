const mongoose = require("mongoose")

const bannerImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  altText: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    trim: true,
    default: "",
  },
  type: {
    type: String,
    enum: ["desktop", "mobile"],
    required: true,
    default: "desktop",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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

// Index for efficient querying
bannerImageSchema.index({ type: 1, isActive: 1, order: 1 })

// Update the updatedAt field before saving
bannerImageSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Static method to get active banners by type
bannerImageSchema.statics.getActiveByType = function (type) {
  return this.find({
    type: type,
    isActive: true,
  }).sort({ order: 1, createdAt: 1 })
}

// Static method to get all banners by type (for admin)
bannerImageSchema.statics.getAllByType = function (type) {
  return this.find({ type: type }).sort({ order: 1, createdAt: 1 })
}

module.exports = mongoose.model("BannerImage", bannerImageSchema)
