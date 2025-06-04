const express = require("express")
const router = express.Router()
const Notification = require("../models/Notification")
const authenticate = require("../middleware/authenticate")

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next()
  }
  return res.status(403).json({ message: "Access denied: Admins only" })
}

// Get admin notifications only
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // Find notifications for admin users only
    const adminUsers = await require("../models/User").find({ isAdmin: true }).select("globalId")
    const adminIds = adminUsers.map((admin) => admin.globalId)

    const notifications = await Notification.find({
      recipientId: { $in: adminIds },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Notification.countDocuments({
      recipientId: { $in: adminIds },
    })

    const formattedNotifications = notifications.map((notification) => ({
      _id: notification._id,
      title: notification.subject,
      message: notification.message,
      type: notification.type === "email" ? "order" : notification.type,
      read: notification.status === "read",
      createdAt: notification.createdAt,
      orderId: notification.orderId,
    }))

    res.json({
      notifications: formattedNotifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching admin notifications:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark notification as read
router.patch("/:id/read", authenticate, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    notification.status = "read"
    await notification.save()

    res.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark all notifications as read
router.patch("/read-all", authenticate, isAdmin, async (req, res) => {
  try {
    const adminUsers = await require("../models/User").find({ isAdmin: true }).select("globalId")
    const adminIds = adminUsers.map((admin) => admin.globalId)

    await Notification.updateMany({ recipientId: { $in: adminIds } }, { status: "read" })

    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete notification
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    await Notification.findByIdAndDelete(req.params.id)

    res.json({ message: "Notification deleted" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Clear all notifications
router.delete("/", authenticate, isAdmin, async (req, res) => {
  try {
    const adminUsers = await require("../models/User").find({ isAdmin: true }).select("globalId")
    const adminIds = adminUsers.map((admin) => admin.globalId)

    await Notification.deleteMany({ recipientId: { $in: adminIds } })

    res.json({ message: "All notifications cleared" })
  } catch (error) {
    console.error("Error clearing notifications:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create notification (admin only)
router.post("/", authenticate, isAdmin, async (req, res) => {
  try {
    const { title, message, type = "system" } = req.body

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" })
    }

    // Send notification to all admin users
    const adminUsers = await require("../models/User").find({ isAdmin: true }).select("globalId")

    const notifications = adminUsers.map((admin) => ({
      recipientId: admin.globalId,
      subject: title,
      message: message,
      type: type,
      status: "sent",
    }))

    await Notification.insertMany(notifications)

    res.status(201).json({ message: "Notification created successfully" })
  } catch (error) {
    console.error("Error creating notification:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
// This code defines the admin notifications routes for managing notifications in an Express.js application.