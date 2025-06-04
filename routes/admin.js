const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const Product = require("../models/Product")
const User = require("../models/User")
const authenticate = require("../middleware/authenticate")

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next()
  }
  return res.status(403).json({ message: "Access denied: Admins only" })
}

// Get dashboard stats - Updated to match frontend expectations
router.get("/stats", authenticate, isAdmin, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    const [
      todayOrders,
      monthOrders,
      yearOrders,
      lowStockItems,
      totalUsers,
      totalSellers,
      totalDeliveryPartners,
      pendingOrders,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { orderDate: { $gte: today }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalIncome: { $sum: "$total" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: startOfMonth }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalIncome: { $sum: "$total" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: startOfYear }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalIncome: { $sum: "$total" },
          },
        },
      ]),
      Product.countDocuments({ stock: { $lte: 10 } }),
      User.countDocuments({}),
      User.countDocuments({ isSeller: true }),
      User.countDocuments({ isDeliveryBoy: true }),
      Order.countDocuments({ status: "processing" }),
    ])

    res.json({
      todayOrders: todayOrders[0]?.count || 0,
      todayIncome: todayOrders[0]?.totalIncome || 0,
      monthOrders: monthOrders[0]?.count || 0,
      monthIncome: monthOrders[0]?.totalIncome || 0,
      yearOrders: yearOrders[0]?.count || 0,
      yearIncome: yearOrders[0]?.totalIncome || 0,
      pendingOrders,
      lowStockItems,
      totalUsers,
      totalSellers,
      totalDeliveryPartners,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get recent orders - Updated to match frontend expectations
router.get("/recent-orders", authenticate, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "cancelled" } })
      .sort({ orderDate: -1 })
      .limit(5)
      .lean()

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      amount: order.total,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
    }))

    res.json(formattedOrders)
  } catch (error) {
    console.error("Error fetching recent orders:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get top selling products - Updated to match frontend expectations
router.get("/top-products", authenticate, isAdmin, async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          sales: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
        },
      },
      {
        $project: {
          name: 1,
          image: { src: "$image" },
          sales: 1,
          revenue: 1,
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
    ])

    res.json(topProducts)
  } catch (error) {
    console.error("Error fetching top products:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get sales trend - Updated to match frontend expectations
router.get("/sales-trend", authenticate, isAdmin, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastYear = new Date(today.getFullYear() - 1, 0, 1)

    const [todaySales, yesterdaySales, monthSales, lastMonthSales, yearSales, lastYearSales] = await Promise.all([
      Order.aggregate([
        { $match: { orderDate: { $gte: today }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: yesterday, $lt: today }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: lastMonth, $lt: new Date(today.getFullYear(), today.getMonth(), 1) },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: new Date(today.getFullYear(), 0, 1) }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: lastYear, $lt: new Date(today.getFullYear(), 0, 1) },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ])

    const calculateChange = (current, previous) => {
      if (!previous || previous.length === 0 || previous[0]?.total === 0) return 0
      const currentTotal = current[0]?.total || 0
      const previousTotal = previous[0]?.total || 0
      return (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1)
    }

    res.json({
      todayChange: Number.parseFloat(calculateChange(todaySales, yesterdaySales)),
      monthChange: Number.parseFloat(calculateChange(monthSales, lastMonthSales)),
      yearChange: Number.parseFloat(calculateChange(yearSales, lastYearSales)),
    })
  } catch (error) {
    console.error("Error fetching sales trend:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
