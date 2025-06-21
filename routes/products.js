const express = require("express")
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  setPrimaryImage,
  deleteImage,
  addProductReview,
  updateReviewStatus,
  deleteReview,
  getProductReviews,
} = require("../controllers/productController")
const authenticate = require("../middleware/authenticate")

const router = express.Router()

// Public routes
router.get("/", getProducts)
router.get("/:globalId", getProduct)
router.get("/:globalId/reviews", getProductReviews)

// Protected routes (require authentication)
router.post("/:globalId/reviews", authenticate, addProductReview)

// Admin-only routes
router.post("/", authenticate, createProduct)
router.put("/:globalId", authenticate, updateProduct)
router.delete("/:globalId", authenticate, deleteProduct)
router.put("/:globalId/set-primary-image", authenticate, setPrimaryImage)
router.delete("/:globalId/image", authenticate, deleteImage)
router.patch("/:globalId/reviews/:reviewId", authenticate, updateReviewStatus)
router.delete("/:globalId/reviews/:reviewId", authenticate, deleteReview)

module.exports = router
