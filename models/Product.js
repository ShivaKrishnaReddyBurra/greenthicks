const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      default: null,
    },
    customerName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
      trim: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String], // array of image URLs
      default: [],
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    globalId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "leafy",
        "fruit",
        "root",
        "herbs",
        "milk",
        "pulses",
        "grains",
        "spices",
        "nuts",
        "oils",
        "snacks",
        "beverages",
      ],
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
    seasonal: {
      type: Boolean,
      default: false,
    },
    new: {
      type: Boolean,
      default: false,
    },
    organic: {
      type: Boolean,
      default: false,
    },
    sku: {
      type: String,
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
    nutrition: {
      type: Object,
      default: {},
    },
    policies: {
      type: Object,
      default: {},
    },
    tags: [String],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        primary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
