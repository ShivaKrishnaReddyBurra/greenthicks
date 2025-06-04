const mongoose = require("mongoose")

const settingSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ["general", "payment", "delivery", "notification"],
    unique: true,
  },
  settings: {
    type: Object,
    required: true,
  },
  updatedBy: {
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
settingSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model("Setting", settingSchema)
