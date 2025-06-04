const express = require("express")
const Order = require("../models/Order")
const User = require("../models/User")
const authenticate = require("../middleware/authenticate")

const router = express.Router()

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    })
  }
  next()
}

// Get all delivery boys
router.get("/delivery-boys", authenticate, isAdmin, async (req, res) => {
  try {
    const deliveryBoys = await User.find({ isDeliveryBoy: true }).select("-password").sort({ createdAt: -1 })

    const deliveryBoysWithStats = await Promise.all(
      deliveryBoys.map(async (boy) => {
        const totalOrders = await Order.countDocuments({ deliveryBoy: boy.globalId })
        const completedOrders = await Order.countDocuments({
          deliveryBoy: boy.globalId,
          deliveryStatus: "delivered",
        })
        const pendingOrders = await Order.countDocuments({
          deliveryBoy: boy.globalId,
          deliveryStatus: { $in: ["assigned", "out-for-delivery"] },
        })

        return {
          ...boy.toObject(),
          stats: {
            totalOrders,
            completedOrders,
            pendingOrders,
            completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
          },
        }
      }),
    )

    res.json({
      success: true,
      deliveryBoys: deliveryBoysWithStats,
      total: deliveryBoysWithStats.length,
    })
  } catch (error) {
    console.error("Error fetching delivery boys:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery boys",
      error: error.message,
    })
  }
})

// Get delivery analytics
router.get("/analytics", authenticate, isAdmin, async (req, res) => {
  try {
    const { period = "month" } = req.query

    const startDate = new Date()
    if (period === "day") {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === "week") {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1)
    }

    const totalDeliveryBoys = await User.countDocuments({ isDeliveryBoy: true })
    const activeDeliveryBoys = await User.countDocuments({
      isDeliveryBoy: true,
      activeStatus: true,
    })

    const totalOrders = await Order.countDocuments({
      orderDate: { $gte: startDate },
    })

    const deliveredOrders = await Order.countDocuments({
      orderDate: { $gte: startDate },
      deliveryStatus: "delivered",
    })

    const pendingOrders = await Order.countDocuments({
      deliveryStatus: { $in: ["assigned", "out-for-delivery"] },
    })

    const avgDeliveryTime = await Order.aggregate([
      {
        $match: {
          deliveryStatus: "delivered",
          orderDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: {
            $avg: {
              $subtract: ["$updatedAt", "$orderDate"],
            },
          },
        },
      },
    ])

    res.json({
      success: true,
      analytics: {
        deliveryBoys: {
          total: totalDeliveryBoys,
          active: activeDeliveryBoys,
          inactive: totalDeliveryBoys - activeDeliveryBoys,
        },
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          pending: pendingOrders,
          deliveryRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0,
        },
        performance: {
          avgDeliveryTime: avgDeliveryTime[0] ? Math.round(avgDeliveryTime[0].avgTime / (1000 * 60 * 60)) : 0, // in hours
        },
      },
    })
  } catch (error) {
    console.error("Error fetching delivery analytics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery analytics",
      error: error.message,
    })
  }
})

// Assign delivery boy to order
router.post("/assign-delivery/:orderId", authenticate, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params
    const { deliveryBoyId } = req.body

    const order = await Order.findOne({ globalId: orderId })
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    const deliveryBoy = await User.findOne({ globalId: deliveryBoyId, isDeliveryBoy: true })
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      })
    }

    await Order.findOneAndUpdate(
      { globalId: orderId },
      {
        deliveryBoy: deliveryBoyId,
        deliveryStatus: "assigned",
        assignedAt: new Date(),
      },
    )

    res.json({
      success: true,
      message: "Delivery boy assigned successfully",
    })
  } catch (error) {
    console.error("Error assigning delivery boy:", error)
    res.status(500).json({
      success: false,
      message: "Failed to assign delivery boy",
      error: error.message,
    })
  }
})

// Get delivery performance report
router.get("/performance-report", authenticate, isAdmin, async (req, res) => {
  try {
    const { deliveryBoyId, startDate, endDate } = req.query

    const matchCondition = {}
    if (deliveryBoyId) {
      matchCondition.deliveryBoy = deliveryBoyId
    }
    if (startDate && endDate) {
      matchCondition.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    const performanceData = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$deliveryBoy",
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$deliveryStatus", "delivered"] }, 1, 0] },
          },
          totalRevenue: { $sum: "$total" },
          avgDeliveryTime: {
            $avg: {
              $cond: [{ $eq: ["$deliveryStatus", "delivered"] }, { $subtract: ["$updatedAt", "$orderDate"] }, null],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "globalId",
          as: "deliveryBoy",
        },
      },
      {
        $unwind: "$deliveryBoy",
      },
      {
        $project: {
          deliveryBoyName: {
            $concat: ["$deliveryBoy.firstName", " ", "$deliveryBoy.lastName"],
          },
          totalOrders: 1,
          deliveredOrders: 1,
          completionRate: {
            $multiply: [{ $divide: ["$deliveredOrders", "$totalOrders"] }, 100],
          },
          totalRevenue: 1,
          avgDeliveryTime: { $divide: ["$avgDeliveryTime", 1000 * 60 * 60] }, // Convert to hours
        },
      },
    ])

    res.json({
      success: true,
      performanceReport: performanceData,
    })
  } catch (error) {
    console.error("Error generating performance report:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate performance report",
      error: error.message,
    })
  }
})

module.exports = router
