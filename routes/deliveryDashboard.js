const express = require("express")
const Order = require("../models/Order")
const User = require("../models/User")
const authenticate = require("../middleware/authenticate")

const router = express.Router()

// Get delivery dashboard stats
router.get("/stats", authenticate, async (req, res) => {
  try {
    const deliveryBoyId = req.user.globalId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Get all orders for this delivery boy
    const allOrders = await Order.find({ deliveryBoy: deliveryBoyId })

    // Pending deliveries
    const pendingDeliveries = allOrders.filter((order) => order.deliveryStatus !== "delivered")

    // Completed deliveries
    const completedDeliveries = allOrders.filter((order) => order.deliveryStatus === "delivered")

    // Today's completed deliveries
    const todayCompleted = completedDeliveries.filter((order) => new Date(order.updatedAt) >= today)

    // Week's completed deliveries
    const weekCompleted = completedDeliveries.filter((order) => new Date(order.updatedAt) >= weekAgo)

    // Month's completed deliveries
    const monthCompleted = completedDeliveries.filter((order) => new Date(order.updatedAt) >= monthAgo)

    // Calculate earnings (10% commission)
    const todayEarnings = todayCompleted.reduce((sum, order) => sum + order.total * 0.1, 0)
    const weekEarnings = weekCompleted.reduce((sum, order) => sum + order.total * 0.1, 0)
    const monthEarnings = monthCompleted.reduce((sum, order) => sum + order.total * 0.1, 0)
    const pendingEarnings = pendingDeliveries.reduce((sum, order) => sum + order.total * 0.1, 0)

    res.json({
      success: true,
      stats: {
        pendingDeliveries: pendingDeliveries.length,
        completedToday: todayCompleted.length,
        totalCompleted: completedDeliveries.length,
        earnings: {
          today: todayEarnings.toFixed(2),
          week: weekEarnings.toFixed(2),
          month: monthEarnings.toFixed(2),
          pending: pendingEarnings.toFixed(2),
        },
        completionRate:
          completedDeliveries.length > 0 ? ((completedDeliveries.length / allOrders.length) * 100).toFixed(1) : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    })
  }
})

// Get earnings breakdown
router.get("/earnings", authenticate, async (req, res) => {
  try {
    const deliveryBoyId = req.user.globalId
    const { period = "month" } = req.query

    const startDate = new Date()
    if (period === "day") {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === "week") {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1)
    }

    const orders = await Order.find({
      deliveryBoy: deliveryBoyId,
      deliveryStatus: "delivered",
      updatedAt: { $gte: startDate },
    })

    const baseEarnings = orders.reduce((sum, order) => sum + order.total * 0.1, 0)
    const bonuses = baseEarnings * 0.15 // 15% bonus
    const tips = baseEarnings * 0.08 // 8% tips
    const totalEarnings = baseEarnings + bonuses + tips

    res.json({
      success: true,
      earnings: {
        base: baseEarnings.toFixed(2),
        bonuses: bonuses.toFixed(2),
        tips: tips.toFixed(2),
        total: totalEarnings.toFixed(2),
        deliveries: orders.length,
      },
    })
  } catch (error) {
    console.error("Error fetching earnings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings",
      error: error.message,
    })
  }
})

module.exports = router
