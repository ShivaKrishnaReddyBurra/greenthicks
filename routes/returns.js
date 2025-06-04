const express = require("express")
const router = express.Router()
const Return = require("../models/Return")
const Order = require("../models/Order")
const authenticate = require("../middleware/authenticate")
const multer = require("multer")
const path = require("path")

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next()
  }
  return res.status(403).json({ message: "Access denied: Admins only" })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/returns")
  },
  filename: (req, file, cb) => {
    cb(null, `return-${Date.now()}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only images are allowed"))
    }
  },
})

// Get all returns (admin only)
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const returns = await Return.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("order", "orderNumber total")
      .populate("user", "name email phone")
      .populate("items.product", "name")

    const total = await Return.countDocuments()

    const formattedReturns = returns.map((returnItem) => ({
      id: `RET-${returnItem._id.toString().slice(-6)}`,
      orderId: `ORD-${returnItem.order.orderNumber}`,
      customer: returnItem.user.name,
      amount: returnItem.refundAmount || returnItem.order.total,
      date: returnItem.createdAt.toISOString().split("T")[0],
      reason: returnItem.reason,
      status: returnItem.status,
      products: returnItem.items.map((item) => item.product.name),
      hasPhotos: returnItem.photos && returnItem.photos.length > 0,
    }))

    res.json({
      returns: formattedReturns,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching returns:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get return by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const returnId = req.params.id.startsWith("RET-") ? req.params.id.substring(4) : req.params.id

    const returnItem = await Return.findById(returnId)
      .populate("order", "orderNumber total paymentMethod items")
      .populate("user", "name email phone address")
      .populate("items.product", "name price images")

    if (!returnItem) {
      return res.status(404).json({ message: "Return not found" })
    }

    // Check if user is admin or the return owner
    if (!req.user.isAdmin && returnItem.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const formattedReturn = {
      id: `RET-${returnItem._id.toString().slice(-6)}`,
      orderId: `ORD-${returnItem.order.orderNumber}`,
      date: returnItem.createdAt.toISOString(),
      requestDate: returnItem.createdAt.toISOString(),
      status: returnItem.status,
      reason: returnItem.reason,
      explanation: returnItem.explanation,
      refundAmount: returnItem.refundAmount || returnItem.order.total,
      paymentMethod: returnItem.order.paymentMethod,
      paymentDetails: returnItem.paymentDetails || {},
      refundPreference: returnItem.refundPreference || "original",
      customer: {
        name: returnItem.user.name,
        email: returnItem.user.email,
        phone: returnItem.user.phone,
        address: returnItem.user.address,
      },
      items: returnItem.items.map((item) => ({
        id: item._id.toString(),
        name: item.product.name,
        price: item.price || item.product.price,
        quantity: item.quantity,
        total: (item.price || item.product.price) * item.quantity,
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null,
      })),
      photos: returnItem.photos || [],
      feedback: returnItem.feedback,
      timeline: [
        {
          status: "Return Requested",
          date: returnItem.createdAt.toISOString(),
          description: "Customer requested return",
        },
        ...(returnItem.status === "Approved"
          ? [
              {
                status: "Return Approved",
                date: returnItem.updatedAt.toISOString(),
                description: "Return request approved by admin",
              },
            ]
          : []),
        ...(returnItem.status === "Rejected"
          ? [
              {
                status: "Return Rejected",
                date: returnItem.updatedAt.toISOString(),
                description: "Return request rejected by admin",
              },
            ]
          : []),
        ...(returnItem.refundStatus === "Refunded"
          ? [
              {
                status: "Refund Initiated",
                date: returnItem.refundInitiatedDate
                  ? returnItem.refundInitiatedDate.toISOString()
                  : returnItem.updatedAt.toISOString(),
                description: `Refund of ${returnItem.refundAmount} initiated`,
              },
              {
                status: "Refund Completed",
                date: returnItem.refundDate.toISOString(),
                description: `Refund successfully processed with transaction ID: ${returnItem.refundTransactionId}`,
              },
            ]
          : []),
      ],
    }

    res.json(formattedReturn)
  } catch (error) {
    console.error("Error fetching return details:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update return status (admin only)
router.put("/:id/status", authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const returnId = req.params.id.startsWith("RET-") ? req.params.id.substring(4) : req.params.id

    const returnItem = await Return.findById(returnId)

    if (!returnItem) {
      return res.status(404).json({ message: "Return not found" })
    }

    if (returnItem.status !== "Pending") {
      return res.status(400).json({ message: "Return has already been processed" })
    }

    returnItem.status = status
    returnItem.processedBy = req.user._id
    returnItem.processedAt = new Date()

    await returnItem.save()

    res.json({ message: `Return ${status.toLowerCase()}` })
  } catch (error) {
    console.error("Error updating return status:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Process refund for return (admin only)
router.post("/:id/refund", authenticate, isAdmin, async (req, res) => {
  try {
    const { refundMethod, transactionId, deliveryPersonId, deliveryNote } = req.body

    if (!["original", "cash", "store_credit"].includes(refundMethod)) {
      return res.status(400).json({ message: "Invalid refund method" })
    }

    const returnId = req.params.id.startsWith("RET-") ? req.params.id.substring(4) : req.params.id

    const returnItem = await Return.findById(returnId)

    if (!returnItem) {
      return res.status(404).json({ message: "Return not found" })
    }

    if (returnItem.status !== "Approved") {
      return res.status(400).json({ message: "Return must be approved before processing refund" })
    }

    if (returnItem.refundStatus === "Refunded") {
      return res.status(400).json({ message: "Refund has already been processed" })
    }

    returnItem.refundMethod = refundMethod
    returnItem.refundStatus = "Refunded"
    returnItem.refundInitiatedDate = new Date()
    returnItem.refundDate = new Date()
    returnItem.refundProcessedBy = req.user._id

    if (refundMethod === "original") {
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID is required for original payment refund" })
      }
      returnItem.refundTransactionId = transactionId
    } else if (refundMethod === "cash") {
      if (!deliveryPersonId) {
        return res.status(400).json({ message: "Delivery person is required for cash refund" })
      }
      returnItem.deliveryPersonId = deliveryPersonId
      returnItem.deliveryNote = deliveryNote
    }

    await returnItem.save()

    res.json({ message: "Refund processed successfully" })
  } catch (error) {
    console.error("Error processing refund:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
