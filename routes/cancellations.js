const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const Cancellation = require("../models/Cancellation")
const authenticate = require("../middleware/authenticate")

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next()
  }
  return res.status(403).json({ message: "Access denied: Admins only" })
}

// Get all cancellations (admin only)
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Find all cancelled orders
    const cancelledOrders = await Order.find({ status: "cancelled" })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email phone")

    const total = await Order.countDocuments({ status: "cancelled" })

    const formattedCancellations = cancelledOrders.map((order) => ({
      id: `CAN-${order._id.toString().slice(-6)}`,
      _id: order._id.toString(),
      orderId: `ORD-${order.id}`,
      customer: {
        name: order.userId?.name || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        email: order.userId?.email || order.shippingAddress.email,
        phone: order.userId?.phone || order.shippingAddress.phone,
      },
      amount: order.total,
      refundAmount: order.total,
      date: order.updatedAt.toISOString().split("T")[0],
      createdAt: order.updatedAt,
      reason: "Order cancelled by user", // Default reason
      status: "approved", // Since order is already cancelled
      paymentMethod: order.paymentMethod,
      refundStatus: order.paymentMethod === "cash-on-delivery" ? "Not Applicable" : "Pending Refund",
    }))

    res.json({
      cancellations: formattedCancellations,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching cancellations:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get cancellation by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const orderId = req.params.id.startsWith("CAN-") ? req.params.id.substring(4) : req.params.id

    const order = await Order.findById(orderId).populate("userId", "name email phone")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.status !== "cancelled") {
      return res.status(404).json({ message: "Order is not cancelled" })
    }

    // Check if user is admin or the order owner
    if (!req.user.isAdmin && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const formattedCancellation = {
      id: `CAN-${order._id.toString().slice(-6)}`,
      orderId: `ORD-${order.id}`,
      date: order.updatedAt.toISOString(),
      requestDate: order.updatedAt.toISOString(),
      status: "approved",
      reason: "Order cancelled by user",
      explanation: "Customer requested cancellation",
      refundAmount: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentMethod === "cash-on-delivery" ? "Not Applicable" : "Pending Refund",
      paymentId: order.paymentId || "N/A",
      refundDate: order.paymentMethod === "cash-on-delivery" ? order.updatedAt : null,
      customer: {
        name: order.userId?.name || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        email: order.userId?.email || order.shippingAddress.email,
        phone: order.userId?.phone || order.shippingAddress.phone,
      },
      items: order.items.map((item) => ({
        id: item._id?.toString() || Math.random().toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        image: item.image,
      })),
      timeline: [
        {
          status: "Order Placed",
          date: order.orderDate.toISOString(),
          description: "Order was successfully placed",
        },
        {
          status: "Cancellation Requested",
          date: order.updatedAt.toISOString(),
          description: "Customer requested cancellation",
        },
        {
          status: "Cancellation Approved",
          date: order.updatedAt.toISOString(),
          description: "Cancellation request approved automatically",
        },
        ...(order.paymentMethod === "cash-on-delivery"
          ? [
              {
                status: "Refund Not Required",
                date: order.updatedAt.toISOString(),
                description: "No refund required for cash on delivery orders",
              },
            ]
          : [
              {
                status: "Refund Pending",
                date: order.updatedAt.toISOString(),
                description: `Refund of ₹${order.total} is pending`,
              },
            ]),
      ],
    }

    res.json(formattedCancellation)
  } catch (error) {
    console.error("Error fetching cancellation details:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update cancellation status (admin only)
router.put("/:id/status", authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const orderId = req.params.id.startsWith("CAN-") ? req.params.id.substring(4) : req.params.id

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.status !== "cancelled") {
      return res.status(400).json({ message: "Order is not cancelled" })
    }

    // Update order with admin action
    order.adminAction = status
    order.processedBy = req.user._id
    order.processedAt = new Date()
    await order.save()

    res.json({ message: `Cancellation ${status}` })
  } catch (error) {
    console.error("Error updating cancellation status:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Process refund for cancellation (admin only)
router.post("/:id/refund", authenticate, isAdmin, async (req, res) => {
  try {
    const { refundMethod, transactionId, deliveryPersonId, deliveryNote } = req.body

    if (!["original", "cash", "store_credit"].includes(refundMethod)) {
      return res.status(400).json({ message: "Invalid refund method" })
    }

    const orderId = req.params.id.startsWith("CAN-") ? req.params.id.substring(4) : req.params.id

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.status !== "cancelled") {
      return res.status(400).json({ message: "Order must be cancelled before processing refund" })
    }

    if (order.refundStatus === "Refunded") {
      return res.status(400).json({ message: "Refund has already been processed" })
    }

    order.refundMethod = refundMethod
    order.refundStatus = "Refunded"
    order.refundInitiatedDate = new Date()
    order.refundDate = new Date()
    order.refundProcessedBy = req.user._id

    if (refundMethod === "original") {
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID is required for original payment refund" })
      }
      order.refundTransactionId = transactionId
    } else if (refundMethod === "cash") {
      if (!deliveryPersonId) {
        return res.status(400).json({ message: "Delivery person is required for cash refund" })
      }
      order.deliveryPersonId = deliveryPersonId
      order.deliveryNote = deliveryNote
    }

    await order.save()

    res.json({ message: "Refund processed successfully" })
  } catch (error) {
    console.error("Error processing refund:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
